import yfinance as yf
import pandas as pd

def get_monthly_returns(ticker):
    # Fetch data from Yahoo Finance for the past 10 years
    stock_data = yf.download(ticker, period="10y", interval="1mo")

    # Calculate monthly returns
    stock_data['Monthly Return'] = stock_data['Adj Close'].pct_change()

    # Drop rows with NaN values
    stock_data.dropna(subset=['Monthly Return'], inplace=True)

    return stock_data['Monthly Return']

if __name__ == "__main__":
    ticker = 'ACWI'  # Apple Inc.
    monthly_returns = get_monthly_returns(ticker)
    print(monthly_returns)
