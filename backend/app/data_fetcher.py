import pandas as pd
import yfinance as yf
import pandas_datareader.data as web
from aiohttp import ClientSession

async def fetch_single_ticker(ticker, session):
    try:
        data = yf.download(ticker, start='1998-01-01', end='2024-01-01', interval='1mo')['Adj Close']
        return data
    except Exception as e:
        print(f"Error fetching data for {ticker}: {e}")
        return None

async def gather_data(tickers):
    async with ClientSession() as session:
        tasks = [fetch_single_ticker(ticker, session) for ticker in tickers]
        results = await asyncio.gather(*tasks)
        data = {ticker: result for ticker, result in zip(tickers, results) if result is not None}
        return pd.DataFrame(data)

def get_fama_french_monthly():
    fama_french_5_factors = web.DataReader("F-F_Research_Data_5_Factors_2x3", "famafrench", date_format="%Y-%m")
    return fama_french_5_factors[0]
