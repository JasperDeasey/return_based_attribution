import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression


def create_cone_chart(active_return_df):
    monthly_excess_return = prepend_zero_to_series(active_return_df['Active'])
    cumulative_excess_return = (1 + monthly_excess_return).cumprod() - 1

    # Fit line of best fit without intercept
    x = np.arange(len(cumulative_excess_return)).reshape(-1, 1)
    y = cumulative_excess_return.values.reshape(-1, 1)
    model = LinearRegression(fit_intercept=False).fit(x, y)
    best_fit_line = model.predict(x).flatten()
    best_fit_line[0] = 0  # Ensuring starts at 0
    annualized_best_fit_return = (1 + model.coef_[0][0]) ** 12 - 1

    # Calculate annualized alpha off of actual cumulative returns
    annualized_alpha = np.power(1 + cumulative_excess_return.iloc[-1], 12 / len(cumulative_excess_return)) - 1

    # Calculate tracking error from monthly excess returns
    monthly_diffs = monthly_excess_return - model.coef_[0][0]
    std_dev_excess_return = np.std(monthly_diffs)
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
    title = f"Annualized Alpha: {annualized_alpha*100:.2f}%, Line of Best Fit: {annualized_best_fit_return*100:.2f}%, Tracking Error: {tracking_error_annualized*100:.2f}%"

    # JSON data for react-chartjs-2
    data = {
        "title": title,
        "labels": dates,
        "datasets": [
            {
                "label": "Actual Cumulative Alpha",
                "data": [float(cumulative_excess_return.iloc[idx]) for idx in range(len(dates))],
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

def prepend_zero_to_series(series):
    earliest_date = series.index.min()
    # Calculate the previous month
    previous_month_date = (earliest_date - pd.DateOffset(months=1)).replace(day=1) + pd.DateOffset(days=-1)
    # Create a new series with the zero value and the previous month date
    new_series = pd.Series([0], index=[previous_month_date])
    # Concatenate the new series with the original series
    return pd.concat([new_series, series])