# analysis/analysis_main.py

import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from . import data_processing
from . import simple_calcs
from . import model
from . import cone_chart

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def process_data(data):
    """
    Main function to process input data and generate analysis results.

    Parameters:
    - data (dict): Input data containing fund returns, benchmark returns, and regression factors.

    Returns:
    - results (dict): Dictionary containing analysis results.
    """
    logger.info("Processing data...")

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
    tasks = []
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

    return results

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

    return model_label, time_frame, result

if __name__ == "__main__":
    def load_json_file(file_path):
        with open(file_path, 'r') as file:
            data = json.load(file)
        return data

    data = load_json_file('../data/request_body.json')
    results = process_data(data)
    # Save or use the results as needed
    print(results)
