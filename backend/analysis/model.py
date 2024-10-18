# analysis/model.py

import numpy as np
import pandas as pd
import statsmodels.api as sm
from sklearn.linear_model import LassoCV, RidgeCV
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import TimeSeriesSplit
import logging
from dataclasses import dataclass, asdict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class RegressionStats:
    coefficients: list
    r_squared: float = None
    adj_r_squared: float = None
    p_values: list = None
    f_statistic: float = None
    aic: float = None
    bic: float = None
    best_alpha: float = None
    intercept: float = 0.0  # Intercept is zero since alpha is not assumed
    score: float = None

def run_regression(returns_df, regression_df, window, model_type, model_label):
    """
    Run regression analysis for a given time window and model type.

    Parameters:
    - returns_df (pd.DataFrame): DataFrame of returns (fund or active).
    - regression_df (pd.DataFrame): DataFrame of regression factors.
    - window (int): Rolling window size in months.
    - model_type (str): Type of regression model ('OLS', 'Ridge', 'Lasso').
    - model_label (str): Label indicating 'Absolute' or 'Active'.

    Returns:
    - results (dict): Dictionary containing regression results.
    """
    logger.info(f"Running {model_type} regression for {model_label} model with window {window}")

    results = {
        "labels": [],    # Dates
        "datasets": [],  # Factor contributions and residuals
        "regression_stats": {}
    }

    # Initialize datasets
    factor_names = regression_df.columns.tolist()
    for factor in factor_names:
        results["datasets"].append({
            "label": factor,
            "data": []
        })

    # Add datasets for residuals and total return
    results["datasets"].append({
        "label": "Residuals",
        "data": []
    })
    results["datasets"].append({
        "label": "Total Return",
        "data": []
    })

    # Prepare time series data
    returns_series = returns_df.iloc[:, 0]
    dates = returns_series.index

    # Loop over rolling windows
    try:
        for end_idx in range(window, len(returns_series) + 1):
            start_idx = end_idx - window
            y = returns_series.iloc[start_idx:end_idx].values
            X = regression_df.iloc[start_idx:end_idx].values

            date = dates[end_idx - 1].strftime('%Y-%m-%d')
            results["labels"].append(date)

            # Fit the model and get stats
            model, stats = fit_model_and_get_stats(X, y, model_type)

            # Calculate factor contributions
            coefficients = np.array(stats.coefficients)
            factor_returns = regression_df.iloc[end_idx - 1].values
            factor_contributions = coefficients * factor_returns

            # Residual is the difference between actual return and predicted return
            predicted_return = np.dot(coefficients, factor_returns)
            residual = y[-1] - predicted_return

            # Append factor contributions and residuals to datasets
            for idx, contribution in enumerate(factor_contributions):
                results["datasets"][idx]["data"].append(float(contribution))

            # Append residuals and total return
            results["datasets"][-2]["data"].append(float(residual))
            results["datasets"][-1]["data"].append(float(y[-1]))

            # Store regression stats
            results["regression_stats"][date] = asdict(stats)

    except Exception as e:
        logger.error(f"Error during regression: {e}", exc_info=True)
        raise

    return results

def fit_model_and_get_stats(X, y, model_type):
    """
    Fit regression model and extract statistics.

    Parameters:
    - X (np.array): Predictor variables.
    - y (np.array): Response variable.
    - model_type (str): Type of regression model ('OLS', 'Ridge', 'Lasso').

    Returns:
    - model: Fitted model object.
    - stats (RegressionStats): Regression statistics.
    """
    model = None
    stats = None

    # Standardize features for Ridge and Lasso
    if model_type in ["Ridge", "Lasso"]:
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
    else:
        X_scaled = X

    if model_type == "OLS":
        # OLS regression with intercept set to zero (alpha is not assumed)
        model = sm.OLS(y, X_scaled).fit()
        stats = RegressionStats(
            coefficients=model.params.tolist(),
            r_squared=model.rsquared,
            adj_r_squared=model.rsquared_adj,
            p_values=model.pvalues.tolist(),
            f_statistic=model.fvalue,
            aic=model.aic,
            bic=model.bic
        )
    elif model_type == "Ridge":
        alphas = np.logspace(-4, 4, 20)
        tscv = TimeSeriesSplit(n_splits=3)
        model = RidgeCV(
            alphas=alphas,
            fit_intercept=False,
            cv=tscv,
            scoring='r2',
            gcv_mode=None,
            store_cv_results=False
        )
        model.fit(X_scaled, y)
        coefficients = model.coef_ / scaler.scale_
        stats = RegressionStats(
            coefficients=coefficients.tolist(),
            best_alpha=model.alpha_,
            score=model.score(X_scaled, y)
        )
    elif model_type == "Lasso":
        alphas = np.logspace(-4, 1, 20)
        tscv = TimeSeriesSplit(n_splits=3)
        model = LassoCV(
            alphas=alphas,
            cv=tscv,
            max_iter=10000,
            fit_intercept=False,
            n_jobs=1,
            random_state=42,
            selection='random'  # For efficiency
        )
        model.fit(X_scaled, y)
        coefficients = model.coef_ / scaler.scale_
        stats = RegressionStats(
            coefficients=coefficients.tolist(),
            best_alpha=model.alpha_,
            score=model.score(X_scaled, y)
        )
    else:
        raise ValueError(f"Unknown model_type: {model_type}")

    return model, stats
