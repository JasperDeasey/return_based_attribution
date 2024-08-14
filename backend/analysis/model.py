import numpy as np
import pandas as pd
import statsmodels.api as sm
from sklearn.linear_model import Lasso, LassoCV, RidgeCV
import logging
import backend.analysis.simple_calcs as simple_calcs


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_regression(returns_df, regression_df, window, model_type, model_type_str, alpha=5):
    logger.info(f"Running {model_type} regression")

    # Initialize the results structure
    results = {
        "labels": [],
        "datasets": [{"label": label, "data": [], "borderColor": color, "fill": False}
                     for label, color in [("Residuals", "color-residuals"),
                                          ("Total Return", "color-total"),
                                          ("Difference from Compounding / Other", "color-difference")]],
        "regression_stats": {}  # New dictionary to store regression statistics
    }

    # Add datasets for each factor
    for j, factor in enumerate(regression_df.columns):
        results["datasets"].insert(j, {
            "label": f"{factor} Contribution",
            "data": [],
            "borderColor": f"color-{j}",
            "fill": False
        })

    # Perform rolling regression
    try:
        for i in range(window, len(returns_df) + 1):
            start_idx, end_idx = i - window, i
            logger.info(f"{model_type_str} -- {model_type} -- {window}: {start_idx} to {end_idx}")

            window_returns = returns_df.iloc[start_idx:end_idx].squeeze()
            window_factors = regression_df.iloc[start_idx:end_idx]

            y = window_returns.values.flatten()
            X = window_factors.values

            # Validate the input data
            if not (np.all(np.isfinite(X)) and np.all(np.isfinite(y))):
                raise ValueError("Non-finite values found in X or y")

            # Fit the model based on the specified type and get regression statistics
            model, stats = fit_model_and_get_stats(X, y, model_type, alpha)

            betas = model.coef_ if model_type != "OLS" else model.params
            predictions = model.predict(X)
            residuals = y - predictions

            # Record results for the current window
            date = returns_df.index[end_idx - 1].strftime('%Y-%m-%d')
            results["labels"].append(date)
            total_return = simple_calcs.annualized_rolling_return(pd.Series(window_returns), window)
            factor_contributions = [beta * simple_calcs.annualized_rolling_return(window_factors.iloc[:, j], window) for j, beta in enumerate(betas)]
            residual_contribution = simple_calcs.annualized_rolling_return(pd.Series(residuals), window)
            difference_from_compounding = total_return - (sum(factor_contributions) + residual_contribution)

            append_results(results, factor_contributions, residual_contribution, total_return,
                           difference_from_compounding)

            # Store regression statistics
            results["regression_stats"][date] = stats

    except Exception as e:
        logger.error(f"Error during regression: {e}", exc_info=True)
        raise

    return results


def fit_model_and_get_stats(X, y, model_type, alpha):
    """Fit the model based on the specified type and collect regression statistics."""
    model = None
    stats = {}

    if model_type == "OLS":
        model = sm.OLS(y, X).fit()  # No intercept added
        stats = {
            "coefficients": model.params.tolist(),
            "r_squared": model.rsquared,
            "adj_r_squared": model.rsquared_adj,
            "p_values": model.pvalues.tolist(),
            "f_statistic": model.fvalue,
            "aic": model.aic,
            "bic": model.bic
        }
    elif model_type == "Ridge":
        alphas = np.logspace(-4, 4, 50)
        model = RidgeCV(alphas=alphas, fit_intercept=False, cv=3).fit(X, y)
        stats = {
            "coefficients": model.coef_.tolist(),
            "best_alpha": model.alpha_,
            "intercept": model.intercept_,
            "score": model.score(X, y)
        }
    elif model_type == "Lasso":
        lasso_cv = LassoCV(alphas=np.logspace(-4, 1, 50), cv=3, max_iter=1000, fit_intercept=False).fit(X, y)
        model = Lasso(alpha=lasso_cv.alpha_, fit_intercept=False).fit(X, y)
        stats = {
            "coefficients": model.coef_.tolist(),
            "best_alpha": lasso_cv.alpha_,
            "intercept": model.intercept_,
            "score": model.score(X, y)
        }

    return model, stats




def append_results(results, factor_contributions, residual_contribution, total_return, difference_from_compounding):
    """Append computed results to the respective dataset in the results."""
    for idx, contribution in enumerate(factor_contributions):
        results["datasets"][idx]["data"].append(float(contribution))
    results["datasets"][-3]["data"].append(float(residual_contribution))
    results["datasets"][-2]["data"].append(float(total_return))
    results["datasets"][-1]["data"].append(float(difference_from_compounding))