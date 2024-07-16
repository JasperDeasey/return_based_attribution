import numpy as np
import pandas as pd
from sklearn.linear_model import LassoCV
from sklearn.linear_model import LinearRegression
import matplotlib.pyplot as plt

TRADING_DAYS_PER_YEAR = 252


def rolling_volatility(returns, years):
    window = int(years * TRADING_DAYS_PER_YEAR)
    return returns.rolling(window=window).std()


def rolling_tracking_error(returns1, returns2, years):
    window = int(years * TRADING_DAYS_PER_YEAR)
    return (returns1 - returns2).rolling(window=window).std()


def rolling_returns(returns, years):
    window = int(years * TRADING_DAYS_PER_YEAR)
    return returns.rolling(window=window).mean()


def rolling_excess_returns(returns1, returns2, years):
    window = int(years * TRADING_DAYS_PER_YEAR)
    return (returns1 - returns2).rolling(window=window).mean()


def prepend_zero_to_series(series):
    # Adding an additional month at the beginning with a zero value
    start_date = series.index[0] - pd.DateOffset(months=1)
    start_date = pd.Timestamp(year=start_date.year, month=start_date.month, day=1)  # Set to the start of the month
    new_index = [start_date] + list(series.index)
    new_series = pd.Series([0] + list(series), index=new_index)
    return new_series


def calculate_alpha(return_stream1, return_stream2):
    # Step 1: Calculate monthly excess return
    monthly_excess_return = return_stream1.resample('M').sum() - return_stream2.resample('M').sum()
    monthly_excess_return = prepend_zero_to_series(monthly_excess_return)

    # Step 3: Calculate cumulative monthly excess return (product of the return series)
    cumulative_excess_return = (1 + monthly_excess_return).cumprod() - 1

    # Fitting the 'historic alpha' line (line of best fit for actual alpha with no intercept)
    x = np.arange(len(cumulative_excess_return)).reshape(-1, 1)
    y = cumulative_excess_return.values.reshape(-1, 1)
    model = LinearRegression(fit_intercept=False).fit(x, y)
    historic_alpha = model.predict(x).flatten()
    monthly_alpha = historic_alpha[0]

    # Step 3: ate standard deviation of excess return
    difference_versus_predicted = monthly_excess_return - monthly_alpha
    std_dev_excess_return = difference_versus_predicted.std()

    # Step 4: Calculate standard deviation bands starting from zero
    std_deviations = std_dev_excess_return * np.sqrt(np.arange(len(cumulative_excess_return)))
    bands = {
        '-2 std': historic_alpha - 2 * std_deviations,
        '-1 std': historic_alpha - 1 * std_deviations,
        '1 std': historic_alpha + 1 * std_deviations,
        '2 std': historic_alpha + 2 * std_deviations,
    }

    # Step 5: Calculate log returns
    log_cumulative_excess_return = np.log(1 + cumulative_excess_return)
    log_historic_alpha = np.log(1 + historic_alpha)
    log_bands = {k: np.log(1 + v) for k, v in bands.items()}

    return log_cumulative_excess_return, log_historic_alpha, log_bands, historic_alpha[-1], std_dev_excess_return


def plot_cone_chart(return_stream1, return_stream2, file_path='cone_chart.png'):
    log_cumulative_excess_return, log_historic_alpha, log_bands, latest_historic_alpha, tracking_error = calculate_alpha(
        return_stream1, return_stream2)

    plt.figure(figsize=(12, 8))
    plt.plot(log_cumulative_excess_return.index, log_cumulative_excess_return, label='Log Cumulative Excess Return',
             color='blue')
    plt.plot(log_cumulative_excess_return.index, log_historic_alpha, label='Historic Alpha', color='black', linewidth=2)
    plt.plot(log_cumulative_excess_return.index, log_bands['-2 std'], label='-2 Std Dev', linestyle='--', color='red')
    plt.plot(log_cumulative_excess_return.index, log_bands['-1 std'], label='-1 Std Dev', linestyle='--',
             color='orange')
    plt.plot(log_cumulative_excess_return.index, log_bands['1 std'], label='1 Std Dev', linestyle='--', color='green')
    plt.plot(log_cumulative_excess_return.index, log_bands['2 std'], label='2 Std Dev', linestyle='--', color='purple')

    plt.fill_between(log_cumulative_excess_return.index, log_bands['-2 std'], log_bands['2 std'], color='gray',
                     alpha=0.1)
    plt.fill_between(log_cumulative_excess_return.index, log_bands['-1 std'], log_bands['1 std'], color='gray',
                     alpha=0.2)

    title_text = f'Alpha Cone Chart - Historic Alpha: {latest_historic_alpha:.4f}, Tracking Error: {tracking_error:.4f}'
    plt.title(title_text)
    plt.xlabel('Date')
    plt.ylabel('Log Returns')
    plt.legend()
    plt.grid(True)

    plt.savefig(file_path)
    plt.close()


def perform_lasso_and_regression(return_streams):
    X = return_streams.iloc[:, 1:]  # Independent variables
    y = return_streams.iloc[:, 0]  # Dependent variable (first column)

    # Perform LASSO regression
    lasso = LassoCV(cv=5).fit(X, y)
    selected_features = lasso.coef_ != 0
    X_selected = X.iloc[:, selected_features]

    # Perform multiple regression
    regression = LinearRegression().fit(X_selected, y)
    return regression


# Example usage:
if __name__ == "__main__":
    import data_fetcher
    acwi_returns = data_fetcher.get_monthly_returns('ACWI')
    world_returns = data_fetcher.get_monthly_returns('URTH')
    plot_cone_chart(world_returns, acwi_returns)

