import json
from dotenv import load_dotenv
import logging
import backend.analysis.cone_chart as cone_chart
import backend.analysis.data_processing as data_processing
import backend.analysis.simple_calcs as simple_calcs
import backend.analysis.model as model

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


load_dotenv()  # Load environment variables from .env file

# Create the database engine


def process_data(data):
    logger.info("Processing data...")

    fund_return_df, benchmark_return_df, active_return_df, regression_df = data_processing.create_return_dfs(data)

    results = {}

    results['cone_chart'] = cone_chart.create_cone_chart(active_return_df)

    for return_df in [fund_return_df, active_return_df]:
        model_type = 'Active' if return_df.equals(active_return_df) else 'Absolute'
        results[model_type] = {}  # Initialize dictionary for this model type
        for months in [12, 36, 60]:
            results[model_type][months] = {}

            return_rolling, rolling_vol = simple_calcs.calculate_and_format_rolling(return_df, months)

            results[model_type][months]['rolling_return'] = json.loads(return_rolling)
            results[model_type][months]['rolling_volatility'] = json.loads(rolling_vol)

            ols_regression = model.run_regression(return_df, regression_df, months, "OLS", model_type)
            lasso_regression = model.run_regression(return_df, regression_df, months, "Lasso", model_type)
            ridge_regression = model.run_regression(return_df, regression_df, months, "Ridge", model_type)
            
            results[model_type][months]['regression_metric'] = {}
            results[model_type][months]['regression_metric']['Lasso'] = lasso_regression
            results[model_type][months]['regression_metric']['Ridge'] = ridge_regression
            results[model_type][months]['regression_metric']['OLS'] = ols_regression

    return results



if __name__ == "__main__":
    def load_json_file(file_path):
        with open(file_path, 'r') as file:
            data = json.load(file)
        return data

    data = load_json_file('../data/request_body.json')
    process_data(data)