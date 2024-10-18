# backend/analysis/analysis_main.py

import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from . import data_processing
from . import simple_calcs
from . import model
from . import cone_chart
from celery_app import celery

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@celery.task(bind=True)
def process_data(self, data):
    """
    Celery task to process input data and generate analysis results.

    Parameters:
    - data (dict): Input data containing fund returns, benchmark returns, and regression factors.

    Returns:
    - results (dict): Dictionary containing analysis results.
    """
    logger.info("Starting data processing task...")

    try:
        # Create return DataFrames
        fund_return_df, benchmark_return_df, active_return_df, regression_df = data_processing.create_return_dfs(data)

        results = {
            'Absolute': {12: {}, 36: {}, 60: {}, 0: {}},
            'Active': {12: {}, 36: {}, 60: {}, 0: {}}
        }

        # Create cone charts
        results['Absolute'][0]['cone_chart'] = cone_chart.create_cone_chart(fund_return_df.iloc[:, 0])
        results['Active'][0]['cone_chart'] = cone_chart.create_cone_chart(active_return_df.iloc[:, 0])

        # Prepare tasks for parallel execution
        with ThreadPoolExecutor() as executor:
            futures = []
            for return_df, model_label in [(fund_return_df, 'Absolute'), (active_return_df, 'Active')]:
                for time_frame in [12, 36, 60]:
                    futures.append(executor.submit(
                        process_time_frame,
                        return_df,
                        regression_df,
                        time_frame,
                        model_label
                    ))

            for future in as_completed(futures):
                try:
                    model_label, time_frame, result = future.result()
                    results[model_label][time_frame] = result
                except Exception as e:
                    logger.error(f"Error processing {model_label} for {time_frame}-month window: {e}", exc_info=True)
                    results[model_label][time_frame] = {'error': str(e)}

        logger.info("Data processing task completed successfully.")
        return results

    except Exception as e:
        logger.error(f"Error in process_data task: {e}", exc_info=True)
        # Update task state with error information
        self.update_state(state='FAILURE', meta={'exc': str(e)})
        raise e  # Re-raise the exception to mark the task as failed

def process_time_frame(return_df, regression_df, time_frame, model_label):
    """
    Process data for a specific time frame and model label.

    Parameters:
    - return_df (pd.DataFrame): DataFrame of returns (fund or active).
    - regression_df (pd.DataFrame): DataFrame of regression factors.
    - time_frame (int): Time frame in months.
    - model_label (str): Label indicating 'Absolute' or 'Active'.

    Returns:
    - Tuple containing model_label, time_frame, and result dictionary.
    """
    logger.info(f"Processing {model_label} model for {time_frame}-month window")

    result = {}

    # Rolling returns and volatility
    return_rolling_json, rolling_vol_json = simple_calcs.calculate_and_format_rolling(return_df, time_frame)
    result['rolling_return'] = json.loads(return_rolling_json)
    result['rolling_volatility'] = json.loads(rolling_vol_json)

    # Regressions
    ols_regression = model.run_regression(return_df, regression_df, time_frame, "OLS", model_label)
    ridge_regression = model.run_regression(return_df, regression_df, time_frame, "Ridge", model_label)
    lasso_regression = model.run_regression(return_df, regression_df, time_frame, "Lasso", model_label)

    result['regression_metric'] = {
        'OLS': ols_regression,
        'Ridge': ridge_regression,
        'Lasso': lasso_regression
    }

    logger.info(f"Completed {model_label} model for {time_frame}-month window")
    return model_label, time_frame, result
