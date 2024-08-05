import http.client
import json
import aiohttp
import asyncio
import pandas as pd
from typing import List, Dict, Any
from dotenv import load_dotenv
import os
from sqlalchemy import create_engine, Column, String, Date, Float, PrimaryKeyConstraint, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.dialects.sqlite import insert

# Load API key from .env file
load_dotenv()
API_KEY = os.getenv('API_KEY')
API_USERNAME = os.getenv('API_USERNAME')
API_PASSWORD = os.getenv('API_PASSWORD')

# Define the database model
Base = declarative_base()


class BenchmarkReturn(Base):
    __tablename__ = 'benchmark_returns'
    benchmark_name = Column(String, primary_key=True)
    date = Column(Date, primary_key=True)
    return_rate = Column(Float)

    __table_args__ = (
        PrimaryKeyConstraint('benchmark_name', 'date', name='benchmark_date_pk'),
    )


# Database setup
DATABASE_URI = 'sqlite:///benchmark_returns.db'
engine = create_engine(DATABASE_URI)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
session = Session()

# API setup
BASE_URL = 'https://client-api.caissallc.com'


class APIAsyncClient:
    def __init__(self):
        self.bearer_token = self._get_bearer_token()

    def _get_bearer_token(self):
        conn = http.client.HTTPSConnection("platform-login.caissallc.com")
        payload = f'grant_type=password&username={API_USERNAME}&password={API_PASSWORD}&scope=offline_access%20read'
        headers = {
            'Authorization': f'Basic {API_KEY}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        conn.request("POST", "/connect/token", payload, headers)
        res = conn.getresponse()
        data = res.read()
        return json.loads(data.decode("utf-8"))["access_token"]

    async def _fetch_with_retry(self, url: str, max_retries: int = 5, backoff_factor: int = 10) -> List[Dict[str, Any]]:
        headers = {'Authorization': f'Bearer {self.bearer_token}'}
        aggregated_results = []
        page_index = 1
        total_size = None

        while total_size is None or len(aggregated_results) < total_size:
            page_url = f"{url}&pageIndex={page_index}"
            message_printed = False
            for retry in range(max_retries):
                try:
                    async with aiohttp.ClientSession() as session:
                        async with session.get(page_url, headers=headers) as response:
                            response.raise_for_status()
                            data = await response.json()
                            if 'results' in data:
                                aggregated_results.extend(data['results'])
                            if 'paging' in data:
                                total_size = data['paging'].get('totalSize', total_size)
                                page_index += 1
                            break
                except aiohttp.ClientResponseError as e:
                    if e.status == 429:
                        if not message_printed:
                            sleep_time = backoff_factor * (2 ** retry)
                            message_printed = True
                        await asyncio.sleep(sleep_time)
                    else:
                        raise e

        return aggregated_results

    async def fetch_benchmark_ids(self) -> List[Dict[str, Any]]:
        url = f'{BASE_URL}/v0/benchmarks/standard?sortBy=BenchmarkName&sortOrder=Asc&pageSize=6000'
        return await self._fetch_with_retry(url)

    async def fetch_benchmark_returns(self, benchmark_id: int) -> List[Dict[str, Any]]:
        url = f'{BASE_URL}/v0/benchmarks/returns?sortBy=Date&benchmark.type=Benchmark&benchmark.id={str(benchmark_id)}&periodicity=Monthly&pageIndex=1&pageSize=1000'
        return await self._fetch_with_retry(url)


def save_to_database(df: pd.DataFrame):
    df['date'] = pd.to_datetime(df['date']).dt.tz_localize(None)
    df = df.rename(columns={"returnRate": "return_rate"})

    with engine.begin() as conn:
        for row in df.itertuples(index=False):
            stmt = insert(BenchmarkReturn).values(
                benchmark_name=row.benchmark_name,
                date=row.date,
                return_rate=row.return_rate
            ).on_conflict_do_update(
                index_elements=['benchmark_name', 'date'],
                set_=dict(return_rate=row.return_rate)
            )
            conn.execute(stmt)
    try:
        if not df.empty:
            print(f'Uploaded {len(df)} rows of {df["benchmark_name"][0]}')
    except Exception as e:
        print(f'Error with dataframe: {e}\n{df}')


def get_most_recent_month_end():
    today = pd.Timestamp.today()
    first_day_of_this_month = today.replace(day=1)
    most_recent_month_end = first_day_of_this_month - pd.Timedelta(days=1)
    return most_recent_month_end.tz_localize(None)


async def main():
    client = APIAsyncClient()

    all_benchmarks = await client.fetch_benchmark_ids()
    all_benchmarks_df = pd.DataFrame(all_benchmarks)

    existing_benchmarks = execute_query_as_dataframe("SELECT DISTINCT benchmark_name FROM benchmark_returns")['benchmark_name'].tolist()
    filtered_benchmarks_df = all_benchmarks_df[~(all_benchmarks_df['benchmarkName'].str.contains('Discontinued')) & ~(all_benchmarks_df['benchmarkName'].isin(existing_benchmarks))]

    most_recent_month_end = get_most_recent_month_end()

    for row in filtered_benchmarks_df.itertuples(index=False):
        returns = await client.fetch_benchmark_returns(row.id)
        return_df = pd.DataFrame(returns)
        return_df['benchmark_name'] = row.benchmarkName
        return_df['date'] = pd.to_datetime(return_df['date']).dt.tz_localize(None)
        return_df = return_df[(return_df['returnRate'] != 0) & pd.notna(return_df['returnRate'])]
        return_df = return_df[return_df['date'] <= most_recent_month_end]
        save_to_database(return_df)

    query_database_and_print()


def query_database_and_print():
    with Session() as session:
        results = session.query(BenchmarkReturn).all()
        for result in results:
            print(f"Benchmark: {result.benchmark_name}, Date: {result.date}, Return Rate: {result.return_rate}")

def execute_query_as_dataframe(query: str) -> pd.DataFrame:
    with engine.connect() as connection:
        df = pd.read_sql_query(query, connection)
    return df


if __name__ == "__main__":
    # asyncio.run(main())

    # Create an engine to connect to the SQLite database
    engine = create_engine('sqlite:///benchmark_returns.db')

    query = """
        SELECT 
            benchmark_name,
            MIN(date) AS min_date,
            MAX(date) AS max_date
        FROM 
            benchmark_returns
        GROUP BY 
            benchmark_name
        ORDER BY 
            LENGTH(benchmark_name);
    """

    # Execute the query and fetch the results into a DataFrame
    df = pd.read_sql_query(query, engine)

    # Save the DataFrame to a CSV file
    df.to_csv('benchmark_date_range.csv', index=False)
    df.to_json('benchmark_metadata_temp.json', orient='records', date_format='iso')
