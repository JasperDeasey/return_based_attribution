import json
import logging
import os
import sys
from dotenv import load_dotenv

load_dotenv()
base_path = os.getenv("ANALYSIS_PATH", ".")

# Add the base path to sys.path
sys.path.insert(0, os.path.abspath(base_path))

# Now you can import your modules as usual
import cone_chart as cone_chart
import data_processing as data_processing
import simple_calcs as simple_calcs
import model as model

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


load_dotenv()  # Load environment variables from .env file

# Create the database engine


def process_data(data):
    logger.info("Processing data...")

    fund_return_df, benchmark_return_df, active_return_df, regression_df = data_processing.create_return_dfs(data)

    results = {
        'Absolute': {
            12: {},
            36: {},
            60: {},
            'Cumulative': {}
        },
        'Active': {
            12: {},
            36: {},
            60: {},
            'Cumulative': {}
        }
    }

    results['Absolute']['Cumulative']['cone_chart'] = cone_chart.create_cone_chart(active_return_df.iloc[:, 0])
    results['Active']['Cumulative']['cone_chart'] = cone_chart.create_cone_chart(fund_return_df.iloc[:, 0])


    for return_df in [fund_return_df, active_return_df]:
        model_type = 'Active' if return_df.equals(active_return_df) else 'Absolute'
        for time_frame in [12, 36, 60]:
            months_int = time_frame
            return_rolling, rolling_vol = simple_calcs.calculate_and_format_rolling(return_df, months_int)

            results[model_type][time_frame]['rolling_return'] = json.loads(return_rolling)
            results[model_type][time_frame]['rolling_volatility'] = json.loads(rolling_vol)

            ols_regression = model.run_regression(return_df, regression_df, months_int, "OLS", model_type)
            lasso_regression = model.run_regression(return_df, regression_df, months_int, "Lasso", model_type)
            ridge_regression = model.run_regression(return_df, regression_df, months_int, "Ridge", model_type)
            
            results[model_type][time_frame]['regression_metric'] = {}
            results[model_type][time_frame]['regression_metric']['Lasso'] = lasso_regression
            results[model_type][time_frame]['regression_metric']['Ridge'] = ridge_regression
            results[model_type][time_frame]['regression_metric']['OLS'] = ols_regression

    return results



if __name__ == "__main__":
    def load_json_file(file_path):
        with open(file_path, 'r') as file:
            data = json.load(file)
        return data

    data = load_json_file('../data/request_body.json')
    process_data(data)