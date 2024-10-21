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
from sqlalchemy.exc import SQLAlchemyError

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
uri = os.getenv("DATABASE_URL")
if uri and uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://")
engine = create_engine(uri)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)

# API setup
BASE_URL = 'https://client-api.caissallc.com'

class APIAsyncClient:
    def __init__(self, session: aiohttp.ClientSession):
        self.session = session
        self.bearer_token = None

    async def _get_bearer_token(self):
        conn = http.client.HTTPSConnection("platform-login.caissallc.com")
        payload = f'grant_type=password&username={API_USERNAME}&password={API_PASSWORD}&scope=offline_access%20read'
        headers = {
            'Authorization': f'Basic {API_KEY}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        conn.request("POST", "/connect/token", payload, headers)
        res = conn.getresponse()
        data = res.read()
        token_data = json.loads(data.decode("utf-8"))
        self.bearer_token = token_data.get("access_token")
        conn.close()

    async def _fetch_with_retry(self, url: str, max_retries: int = 5, backoff_factor: int = 1) -> List[Dict[str, Any]]:
        headers = {'Authorization': f'Bearer {self.bearer_token}'}
        aggregated_results = []
        page_index = 1
        total_size = None

        while total_size is None or len(aggregated_results) < total_size:
            page_url = f"{url}&pageIndex={page_index}"
            for retry in range(max_retries):
                try:
                    async with self.session.get(page_url, headers=headers) as response:
                        response.raise_for_status()
                        data = await response.json()
                        if 'results' in data:
                            aggregated_results.extend(data['results'])
                        if 'paging' in data:
                            total_size = data['paging'].get('totalSize', total_size)
                            page_index += 1
                        break  # Exit retry loop on success
                except aiohttp.ClientResponseError as e:
                    if e.status == 429:
                        sleep_time = backoff_factor * (2 ** retry)
                        print(f"Rate limited. Retrying in {sleep_time} seconds...")
                        await asyncio.sleep(sleep_time)
                    else:
                        print(f"HTTP error {e.status} for URL: {page_url}")
                        raise e
                except aiohttp.ClientError as e:
                    print(f"Client error: {e}. Retrying...")
                    await asyncio.sleep(backoff_factor * (2 ** retry))
            else:
                print(f"Failed to fetch {page_url} after {max_retries} retries.")
                raise Exception(f"Max retries exceeded for URL: {page_url}")

        return aggregated_results

    async def fetch_benchmark_ids(self) -> List[Dict[str, Any]]:
        url = f'{BASE_URL}/v0/benchmarks/standard?sortBy=BenchmarkName&sortOrder=Asc&pageSize=6000'
        return await self._fetch_with_retry(url)

    async def fetch_benchmark_returns(self, benchmark_id: int) -> List[Dict[str, Any]]:
        url = f'{BASE_URL}/v0/benchmarks/returns?sortBy=Date&benchmark.type=Benchmark&benchmark.id={str(benchmark_id)}&periodicity=Monthly&pageSize=1000'
        return await self._fetch_with_retry(url)

def save_to_database(df: pd.DataFrame):
    df['date'] = pd.to_datetime(df['date']).dt.tz_localize(None)
    df = df.rename(columns={"returnRate": "return_rate"})

    # Prepare data for bulk insert
    records = df.to_dict(orient='records')
    insert_mappings = [
        {
            'benchmark_name': record['benchmark_name'],
            'date': record['date'],
            'return_rate': record['return_rate']
        }
        for record in records
    ]

    try:
        with engine.begin() as conn:
            conn.execute(
                insert(BenchmarkReturn)
                .values(insert_mappings)
                .on_conflict_do_update(
                    index_elements=['benchmark_name', 'date'],
                    set_=dict(return_rate=text('excluded.return_rate'))
                )
            )
        if not df.empty:
            print(f'Uploaded {len(df)} rows of returns to the database for {len(df['benchmark_name'].unique())} benchmarks')
    except SQLAlchemyError as e:
        print(f'Database error: {e}\nDataframe: {df}')

def get_most_recent_month_end():
    today = pd.Timestamp.today()
    first_day_of_this_month = today.replace(day=1)
    most_recent_month_end = first_day_of_this_month - pd.Timedelta(days=1)
    return most_recent_month_end.tz_localize(None)

async def main():
    # Initialize a single aiohttp session
    timeout = aiohttp.ClientTimeout(total=60)  # Adjust timeout as needed
    async with aiohttp.ClientSession(timeout=timeout) as session:
        client = APIAsyncClient(session)
        await client._get_bearer_token()

        all_benchmarks = await client.fetch_benchmark_ids()
        all_benchmarks_df = pd.DataFrame(all_benchmarks)

        # existing_benchmarks = execute_query_as_dataframe("SELECT DISTINCT benchmark_name FROM benchmark_returns")['benchmark_name'].tolist()
        filtered_benchmarks_df = all_benchmarks_df[
            ~all_benchmarks_df['benchmarkName'].str.contains('Discontinued', na=False) &
            ~all_benchmarks_df['benchmarkName'].str.contains('Price', na=False)
        ]

        most_recent_month_end = get_most_recent_month_end()

        # Define concurrency level
        concurrency = 50  # Adjust based on API rate limits
        semaphore = asyncio.Semaphore(concurrency)

        async def fetch_and_process(row):
            async with semaphore:
                try:
                    returns = await client.fetch_benchmark_returns(row.id)
                    return_df = pd.DataFrame(returns)
                    if return_df.empty:
                        return None
                    return_df['benchmark_name'] = row.benchmarkName
                    return_df['date'] = pd.to_datetime(return_df['date']).dt.tz_localize(None)
                    return_df = return_df[(return_df['returnRate'] != 0) & pd.notna(return_df['returnRate'])]
                    return_df = return_df[return_df['date'] <= most_recent_month_end]
                    print(f"{(row.benchmarkName[:30]).ljust(30)}: {return_df['date'].min().strftime('%Y-%m-%d')} --> {return_df['date'].max().strftime('%Y-%m-%d')}")
                    return return_df
                except Exception as e:
                    print(f"Error fetching returns for benchmark {row.id}: {e}")
                    return None

        # Create tasks for concurrent execution
        tasks = [
            fetch_and_process(row)
            for row in filtered_benchmarks_df.itertuples(index=False)
        ]

        # Gather results with concurrency
        results = await asyncio.gather(*tasks)

        # Concatenate all DataFrames, excluding None
        combined_df = pd.concat([df for df in results if df is not None], ignore_index=True)

        print("Saving to database...")
        save_to_database(combined_df)
        save_metadata_to_json(combined_df)
        

def execute_query_as_dataframe(query: str) -> pd.DataFrame:
    with engine.connect() as connection:
        df = pd.read_sql_query(query, connection)
    return df

def save_metadata_to_json(df):
    df['date'] = pd.to_datetime(df['date'])

    # Group by 'benchmark_name' and get the min and max date for each benchmark
    result_df = df.groupby('benchmark_name').agg(
        min_date=('date', 'min'),
        max_date=('date', 'max')
    ).reset_index()

    # Convert the min and max dates to the 'YYYY-MM-DD' format
    result_df['min_date'] = result_df['min_date'].dt.strftime('%Y-%m-%d')
    result_df['max_date'] = result_df['max_date'].dt.strftime('%Y-%m-%d')

    # Convert DataFrame to list of dictionaries with required field names
    data = result_df.to_dict(orient='records')

    # Save the data as JSON in the required format
    with open('../../frontend/public/benchmark_metadata_temp.json', 'w') as json_file:
        json.dump(data, json_file, indent=4)

    print("JSON file saved as 'benchmark_metadata_temp.json'")



if __name__ == "__main__":
    print('Starting benchmark return upload...')
    asyncio.run(main())
    print('Finished uploading benchmark returns')
