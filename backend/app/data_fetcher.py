import pandas as pd
import aiohttp
import asyncio
import pandas_datareader.data as web

API_KEY = '9b844e8409a741cc8591e874a1c5f99f'

async def fetch_single_ticker(ticker, session):
    url = f'https://api.twelvedata.com/time_series?symbol={ticker}&interval=1month&outputsize=5000&apikey={API_KEY}'
    try:
        async with session.get(url) as response:
            data = await response.json()
            if "values" in data:
                df = pd.DataFrame(data["values"])
                df['datetime'] = pd.to_datetime(df['datetime'])
                df.set_index('datetime', inplace=True)
                df = df[['adjusted_close']].rename(columns={'adjusted_close': ticker})
                return df
            else:
                print(f"Error fetching data for {ticker}: {data.get('message', 'Unknown error')}")
                return None
    except Exception as e:
        print(f"Error fetching data for {ticker}: {e}")
        return None

async def gather_data(tickers):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_single_ticker(ticker, session) for ticker in tickers]
        results = await asyncio.gather(*tasks)
        data = [result for result in results if result is not None]
        if data:
            return pd.concat(data, axis=1)
        else:
            return pd.DataFrame()

def get_fama_french_monthly():
    fama_french_5_factors = web.DataReader("F-F_Research_Data_5_Factors_2x3", "famafrench", date_format="%Y-%m")
    return fama_french_5_factors[0]
