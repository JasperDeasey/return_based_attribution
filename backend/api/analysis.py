import numpy as np
import pandas as pd
from sklearn.linear_model import LassoCV
from sklearn.linear_model import LinearRegression
from sqlalchemy import create_engine, Column, String, Date, Float, PrimaryKeyConstraint, text
import json
import statsmodels.api as sm
from sklearn.linear_model import Lasso, Ridge
from sklearn.preprocessing import StandardScaler


def process_data(data):
    fund_return_df, benchmark_return_df, active_return_df, regression_df = create_return_dfs(data)

    results = {}

    results['cone_chart'] = create_cone_chart(active_return_df)

    for return_df in [fund_return_df, active_return_df]:
        model_type = 'Active' if return_df.equals(active_return_df) else 'Absolute'
        results[model_type] = {}  # Initialize dictionary for this model type

        for months in [12, 36, 60]:
            results[model_type][months] = {}

            return_rolling, rolling_vol = calculate_and_format_rolling(return_df, months)

            results[model_type][months]['rolling_return'] = json.loads(return_rolling)
            results[model_type][months]['rolling_volatility'] = json.loads(rolling_vol)

            ols_regression = run_regression(return_df, regression_df, months, "OLS")
            lasso_regression = run_regression(return_df, regression_df, months, "Lasso")
            ridge_regression = run_regression(return_df, regression_df, months, "Ridge")
            
            results[model_type][months]['regression_metric'] = {}
            results[model_type][months]['regression_metric']['Lasso'] = lasso_regression
            results[model_type][months]['regression_metric']['Ridge'] = ridge_regression
            results[model_type][months]['regression_metric']['OLS'] = ols_regression

    return results


def annualized_return(returns):
    compounded_return = (1 + returns).prod()
    periods = len(returns)
    annualized = compounded_return ** (12 / periods) - 1
    return annualized

def run_regression(returns_df, regression_df, window, model_type, alpha=5):
    results = {
        "labels": [],
        "datasets": []
    }
    for j, factor in enumerate(regression_df.columns):
        results["datasets"].append({
            "label": factor + " Contribution",
            "data": [],
            "borderColor": f"color-{j}",
            "fill": False
        })
    results["datasets"].append({
        "label": "Residuals",
        "data": [],
        "borderColor": "color-residuals",
        "fill": False
    })
    results["datasets"].append({
        "label": "Total Return",
        "data": [],
        "borderColor": "color-total",
        "fill": False
    })

    scaler = StandardScaler()

    for i in range(window, len(returns_df) + 1):
        start_idx = i - window
        end_idx = i

        window_returns = returns_df.iloc[start_idx:end_idx]
        window_factors = regression_df.iloc[start_idx:end_idx]

        y = window_returns.values.flatten()
        X = window_factors.values
        X_scaled = scaler.fit_transform(X)

        if model_type == "OLS":
            X_scaled_with_const = sm.add_constant(X_scaled)  # Add intercept after scaling
            model = sm.OLS(y, X_scaled_with_const).fit()
            betas = model.params[1:]  # exclude intercept
            intercept = model.params[0]
        elif model_type == "Ridge":
            model = Ridge(alpha=alpha).fit(X_scaled, y)
            betas = model.coef_
            intercept = model.intercept_
        elif model_type == "Lasso":
            lasso_cv = LassoCV(alphas=np.logspace(-4, 1, 50), cv=5, max_iter=10000).fit(X_scaled, y)
            model = Lasso(alpha=lasso_cv.alpha_).fit(X_scaled, y)
            betas = model.coef_
            intercept = model.intercept_

        # Scale betas back to the original scale
        betas = betas / scaler.scale_

        predictions = model.predict(X_scaled_with_const if model_type == "OLS" else X_scaled)
        residuals = y - predictions

        date = returns_df.index[end_idx - 1].strftime('%Y-%m-%d')
        results["labels"].append(date)
        total_return = annualized_return(window_returns)
        results["datasets"][-1]["data"].append(float(total_return) * 100)

        factor_contributions = []
        for j, factor in enumerate(regression_df.columns):
            factor_data = window_factors.iloc[:, j]
            factor_annualized_return = annualized_return(factor_data)
            beta = betas[j]
            factor_contribution = beta * factor_annualized_return
            factor_contributions.append(factor_contribution)
            results["datasets"][j]["data"].append(float(factor_contribution))

        residual_contribution = total_return - np.sum(factor_contributions)
        results["datasets"][-2]["data"].append(float(residual_contribution))

    return results


def format_json(data_series, label):
    # Filter out NaN values and get their corresponding dates
    filtered_series = data_series.dropna()
    dates = filtered_series.index.strftime('%Y-%m-%d').tolist()
    
    # Prepare data for JSON output
    data = {
        "labels": dates,
        "datasets": [
            {
                "label": label,
                "data": filtered_series.tolist(),
                "borderColor": "blue" if "Return" in label else "red",
                "fill": False
            }
        ]
    }
    
    return json.dumps(data, indent=4)

def calculate_and_format_rolling(return_df, months):
    # Calculate rolling return, removing NaN values
    return_rolling = return_df.iloc[:, 0].rolling(window=months).apply(
        lambda x: (1 + x).prod() ** (12 / months) - 1, raw=False
    ).dropna()

    # Calculate rolling volatility, removing NaN values
    rolling_vol = (return_df.iloc[:, 0].rolling(window=months).std() * np.sqrt(12 / months)).dropna()

    # Format JSON without NaN values
    json_return_rolling = format_json(return_rolling, f"{int(months / 12)}yr Rolling Return")
    json_rolling_vol = format_json(rolling_vol, f"{int(months / 12)}yr Rolling Volatility")

    return json_return_rolling, json_rolling_vol

def prepend_zero_to_series(series):
    earliest_date = series.index.min()
    # Calculate the previous month
    previous_month_date = (earliest_date - pd.DateOffset(months=1)).replace(day=1) + pd.DateOffset(days=-1)
    # Create a new series with the zero value and the previous month date
    new_series = pd.Series([0], index=[previous_month_date])
    # Concatenate the new series with the original series
    return pd.concat([new_series, series])

def create_cone_chart(active_return_df):
    monthly_excess_return = prepend_zero_to_series(active_return_df['Active'])
    cumulative_excess_return = (1 + monthly_excess_return).cumprod() - 1

    # Fit line of best fit without intercept
    x = np.arange(len(cumulative_excess_return)).reshape(-1, 1)
    y = cumulative_excess_return.values.reshape(-1, 1)
    model = LinearRegression(fit_intercept=False).fit(x, y)
    best_fit_line = model.predict(x).flatten()
    best_fit_line[0] = 0  # Ensuring starts at 0

    # Calculate annualized alpha off of actual cumulative returns
    annualized_alpha = np.power(1 + cumulative_excess_return[-1], 12 / len(cumulative_excess_return)) - 1

    # Calculate tracking error from monthly excess returns
    std_dev_excess_return = np.std(monthly_excess_return)
    tracking_error_annualized = std_dev_excess_return * np.sqrt(12)

    # Calculate standard deviation bands from the line of best fit
    std_deviations = std_dev_excess_return * np.sqrt(np.arange(len(best_fit_line)))
    bands = {
        '-2 STD': best_fit_line - 2 * std_deviations,
        '-1 STD': best_fit_line - 1 * std_deviations,
        '+1 STD': best_fit_line + 1 * std_deviations,
        '+2 STD': best_fit_line + 2 * std_deviations,
    }

    dates = monthly_excess_return.index.strftime('%Y-%m-%d').tolist()
    title = f"Annualized Alpha: {annualized_alpha*100:.2f}%, Tracking Error: {tracking_error_annualized*100:.2f}%"

    # JSON data for react-chartjs-2
    data = {
        "title": title,
        "labels": dates,
        "datasets": [
            {
                "label": "Actual Cumulative Alpha",
                "data": [float(cumulative_excess_return[idx]) for idx in range(len(dates))],
                "borderColor": "red",
                "fill": False
            },
            {
                "label": "Best Fit Line",
                "data": [float(best_fit_line[idx]) for idx in range(len(dates))],
                "borderColor": "green",
                "fill": False
            },
            {
                "label": "-2 STD",
                "data": [float(bands['-2 STD'][idx]) for idx in range(len(dates))],
                "borderColor": "blue",
                "fill": False
            },
            {
                "label": "-1 STD",
                "data": [float(bands['-1 STD'][idx]) for idx in range(len(dates))],
                "borderColor": "lightblue",
                "fill": False
            },
            {
                "label": "+1 STD",
                "data": [float(bands['+1 STD'][idx]) for idx in range(len(dates))],
                "borderColor": "lightblue",
                "fill": False
            },
            {
                "label": "+2 STD",
                "data": [float(bands['+2 STD'][idx]) for idx in range(len(dates))],
                "borderColor": "blue",
                "fill": False
            }
        ]
    }

    return data


# Helper function to calculate annualized rolling returns
def annualized_rolling_return(returns, window, periods_per_year=12):
    rolling_cum_return = returns.rolling(window=window).apply(lambda x: (1 + x).prod() - 1, raw=False)
    n_periods = window
    annualized_rolling = (1 + rolling_cum_return) ** (periods_per_year / n_periods) - 1
    return annualized_rolling


def create_return_dfs(data):
    engine = create_engine('sqlite:///data/benchmark_returns.db')
    fund_description = data['fund']['description']
    benchmark_description = data['benchmark']['description']

    fund_return_df = pd.DataFrame(data['fund']['pastedData'])
    fund_return_df['return'] = pd.to_numeric(fund_return_df['return'])
    fund_return_df = fund_return_df.drop(columns=['id']).rename(columns={'return': fund_description})
    fund_return_df['date'] = pd.to_datetime(fund_return_df['date'])
    fund_return_df['date'] = fund_return_df['date'] + pd.offsets.MonthEnd(0)
    fund_return_df.set_index('date', inplace=True)

    benchmark_return_df = pd.read_sql_query(
        f"SELECT * FROM benchmark_returns WHERE benchmark_name='{data['benchmark']['source']}'", engine).rename(
        columns={'return_rate': benchmark_description}).drop(columns=['benchmark_name'])
    benchmark_return_df['date'] = pd.to_datetime(benchmark_return_df['date'])
    benchmark_return_df['date'] = benchmark_return_df['date'] + pd.offsets.MonthEnd(0)
    benchmark_return_df.set_index('date', inplace=True)
    benchmark_return_df = benchmark_return_df.reindex(fund_return_df.index)

    active_return_df = fund_return_df.merge(benchmark_return_df, left_index=True, right_index=True, how="left")
    active_return_df['Active'] = active_return_df[fund_description] - active_return_df[benchmark_description]
    active_return_df = active_return_df.drop(columns=[fund_description, benchmark_description])

    regression_df = pd.DataFrame()
    regression_df = regression_df.reindex(fund_return_df.index)

    remaining_funds = []
    for regression_json in data['residual_return_streams']:
        if not regression_json['residualization']:
            df = pd.read_sql_query(f"SELECT * FROM benchmark_returns WHERE benchmark_name='{regression_json['source']}'", engine)
            df = df.rename(columns={'return_rate': regression_json['description']}).drop(columns=['benchmark_name'])
            df['date'] = pd.to_datetime(df['date'])
            df.set_index('date', inplace=True)
            regression_df = regression_df.merge(df, left_index=True, right_index=True, how='left')

        elif set(regression_json['residualization']).issubset(set(regression_df.columns)):
            df = pd.read_sql_query( f"SELECT * FROM benchmark_returns WHERE benchmark_name='{regression_json['source']}'", engine)
            df = df.drop(columns=['benchmark_name'])
            df['date'] = pd.to_datetime(df['date'])
            df.set_index('date', inplace=True)
            df = df.reindex(fund_return_df.index)

            y = df['return_rate']
            X = regression_df[regression_json['residualization']]
            X = sm.add_constant(X)
            model = sm.OLS(y, X).fit()
            residuals = model.resid
            regression_df[regression_json['description']] = residuals

        else:
            remaining_funds.append(regression_json)
    j = 0
    max_tries = len(remaining_funds) * 3
    while remaining_funds:
        i = j % (len(remaining_funds) - 1)
        if set(remaining_funds[i]['residualization']).issubset(set(regression_df.columns)):
            df = pd.read_sql_query(
                f"SELECT * FROM benchmark_returns WHERE benchmark_name='{regression_json['source']}'",
                engine)
            df.rename(columns={'return': remaining_funds[i]['description']}, inplace=True)
            df['date'] = pd.to_datetime(df['date'])
            df.set_index('date', inplace=True)

            y = df['return']
            X = df[regression_df['residualization']]
            X = sm.add_constant(X)
            model = sm.OLS(y, X).fit()
            residuals = model.resid
            regression_df[remaining_funds[i]['description']] = residuals
            del remaining_funds[i]
        j += 1
        if j > max_tries:
            Exception(f"Residual returns could not be created for {remaining_funds}")
    return fund_return_df, benchmark_return_df, active_return_df, regression_df


def load_json_file(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)
    return data

# Example usage:
if __name__ == "__main__":

    data = load_json_file('../data/request_body.json')
    process_data(data)