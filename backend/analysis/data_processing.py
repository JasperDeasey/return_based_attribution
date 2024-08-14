import pandas as pd
import json
import statsmodels.api as sm
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine


load_dotenv()

uri = os.getenv("DATABASE_URL")
if uri and uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://")
engine = create_engine(uri)


def create_return_dfs(data):
    fund_description = data['fund']['description']
    benchmark_description = data['benchmark']['description']
    fund_return_df = prepare_fund_return_df(data['fund'], fund_description)
    benchmark_return_df = fetch_benchmark_return_df(data['benchmark']['source'], benchmark_description)
    active_return_df = calculate_active_returns(fund_return_df, benchmark_return_df, fund_description, benchmark_description)
    regression_df, remaining_funds = create_initial_regression_df(fund_return_df, data['residual_return_streams'])
    regression_df = process_remaining_funds(regression_df, remaining_funds)
    return fund_return_df, benchmark_return_df, active_return_df, regression_df


def prepare_fund_return_df(fund_data, fund_description):
    df = pd.DataFrame(fund_data['pastedData'])
    df['return'] = pd.to_numeric(df['return'])
    df = df.drop(columns=['id']).rename(columns={'return': fund_description})
    df['date'] = pd.to_datetime(df['date']) + pd.offsets.MonthEnd(0)
    df.set_index('date', inplace=True)
    return df


def fetch_benchmark_return_df(benchmark_source, benchmark_description):
    try:
        df = pd.read_sql_query(
            f"SELECT * FROM benchmark_returns WHERE benchmark_name='{benchmark_source}'", engine
        )
        df = df.rename(columns={'return_rate': benchmark_description}).drop(columns=['benchmark_name'])
        df['date'] = pd.to_datetime(df['date']) + pd.offsets.MonthEnd(0)
        df.set_index('date', inplace=True)
        return df
    except Exception as e:
        raise Exception(f"Error fetching benchmark returns: {e}")





def create_initial_regression_df(fund_return_df, residual_return_streams):
    regression_df = pd.DataFrame(index=fund_return_df.index)
    remaining_funds = []

    for regression_json in residual_return_streams:
        if not regression_json['residualization']:
            try:
                df = fetch_benchmark_return_df(regression_json['source'], regression_json['description'])
                regression_df = regression_df.merge(df, left_index=True, right_index=True, how='left')
            except Exception as e:
                raise Exception(f"Error fetching regression data: {e}")
        elif set(regression_json['residualization']).issubset(set(regression_df.columns)):
            regression_df = perform_residualization(regression_df, regression_json)
        else:
            remaining_funds.append(regression_json)

    return regression_df, remaining_funds


def perform_residualization(regression_df, regression_json):
    try:
        df = fetch_benchmark_return_df(regression_json['source'], 'return_rate')
        df = df.reindex(regression_df.index)
        y = df['return_rate']
        X = regression_df[regression_json['residualization']]
        X = sm.add_constant(X)
        model = sm.OLS(y, X).fit()
        residuals = model.resid
        regression_df[regression_json['description']] = residuals
    except Exception as e:
        raise Exception(f"Error processing regression data: {e}")
    return regression_df


def process_remaining_funds(regression_df, remaining_funds):
    j = 0
    max_tries = len(remaining_funds) * 3

    while remaining_funds:
        i = j % len(remaining_funds)
        if set(remaining_funds[i]['residualization']).issubset(set(regression_df.columns)):
            try:
                regression_df = perform_residualization(regression_df, remaining_funds[i])
                del remaining_funds[i]
            except Exception as e:
                raise Exception(f"Error processing remaining regression data: {e}")
        j += 1
        if j > max_tries:
            raise Exception(f"Residual returns could not be created for {remaining_funds}")

    return regression_df


def calculate_active_returns(fund_return_df, benchmark_return_df, fund_description, benchmark_description):
    benchmark_return_df = benchmark_return_df.reindex(fund_return_df.index)
    active_return_df = fund_return_df.merge(benchmark_return_df, left_index=True, right_index=True, how="left")
    active_return_df['Active'] = active_return_df[fund_description] - active_return_df[benchmark_description]
    return active_return_df.drop(columns=[fund_description, benchmark_description])

def load_json_file(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)
    return data

