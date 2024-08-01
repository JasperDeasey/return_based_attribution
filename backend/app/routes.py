from flask import Blueprint
from .data_fetcher import gather_data, get_fama_french_monthly
from .analysis import fit_factor_model
import asyncio

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def hello_world():
    return 'Hello, World!'

@main_bp.route('/fetch-data')
def fetch_data():
    async def fetch():
        # Define the list of commodity tickers to fetch
        tickers = ['CL=F', 'NG=F', 'GC=F', 'SI=F', 'ZW=F', 'ZC=F']

        # Gather the commodity data
        monthly_prices = await gather_data(tickers)

        # Convert prices to monthly returns
        monthly_returns = monthly_prices.pct_change().dropna()

        # Get Fama-French factors
        ff_factors = get_fama_french_monthly()

        # Fit the dynamic factor model
        res = fit_factor_model(monthly_returns)

        return {
            'summary': res.summary().as_text(),
            'factors': res.factors.smoothed.head().to_json()
        }

    return asyncio.run(fetch())
