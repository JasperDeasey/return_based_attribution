import numpy as np
import pandas as pd
import json


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
    rolling_vol = (return_df.iloc[:, 0].rolling(window=months).std() * np.sqrt(12)).dropna()

    # Format JSON without NaN values
    json_return_rolling = format_json(return_rolling, f"{int(months / 12)}yr Rolling Return")
    json_rolling_vol = format_json(rolling_vol, f"{int(months / 12)}yr Rolling Volatility")

    return json_return_rolling, json_rolling_vol


def annualized_rolling_return(returns, window, periods_per_year=12):
    def calc_annualized(x):
        if len(x) < window or x.isnull().any():
            return np.nan
        return (1 + x).prod() ** (periods_per_year / len(x)) - 1

    rolling_cum_return = returns.rolling(window=window).apply(calc_annualized, raw=False)
    return rolling_cum_return