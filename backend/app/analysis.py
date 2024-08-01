import pandas as pd
import numpy as np
from statsmodels.tsa.statespace.dynamic_factor import DynamicFactor

def fit_factor_model(monthly_returns):
    mod = DynamicFactor(monthly_returns, k_factors=1, factor_order=1, error_order=1)
    res = mod.fit()
    return res