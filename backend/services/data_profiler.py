"""
Data profiler: generates statistical profiles and detects anomalies.
"""

import logging
from datetime import datetime

import numpy as np
import pandas as pd

logger = logging.getLogger("data-agent.profiler")


def profile(df: pd.DataFrame) -> dict:
    """
    Generate a full statistical profile of a DataFrame.

    Returns the exact schema defined in PRD Section 6.1.3:
    - row_count, column_count
    - Per-column statistics (numeric, categorical, datetime)
    - Detected anomalies
    """
    result = {
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": [],
        "detected_anomalies": [],
    }

    for col_name in df.columns:
        series = df[col_name]
        col_profile = _profile_column(series, col_name, len(df))
        result["columns"].append(col_profile)

        # Run anomaly detection on this column
        anomalies = _detect_anomalies(series, col_name, len(df))
        result["detected_anomalies"].extend(anomalies)

    return result


def _profile_column(series: pd.Series, name: str, total_rows: int) -> dict:
    """Profile a single column based on its dtype."""
    null_count = int(series.isna().sum())
    null_rate = round(null_count / total_rows, 4) if total_rows > 0 else 0.0

    # Try to infer the best dtype
    dtype_str = str(series.dtype)

    # Check if it's a datetime column
    if pd.api.types.is_datetime64_any_dtype(series):
        return _profile_datetime(series, name, null_count, null_rate)

    # Try to parse as datetime if object type
    if series.dtype == "object":
        try:
            parsed = pd.to_datetime(series, errors="coerce", infer_datetime_format=True)
            if parsed.notna().sum() > len(series) * 0.8:  # >80% parseable as dates
                return _profile_datetime(parsed, name, null_count, null_rate)
        except Exception:
            pass

    # Numeric columns
    if pd.api.types.is_numeric_dtype(series):
        return _profile_numeric(series, name, dtype_str, null_count, null_rate)

    # Categorical / string columns
    return _profile_categorical(series, name, dtype_str, null_count, null_rate)


def _profile_numeric(series: pd.Series, name: str, dtype_str: str, null_count: int, null_rate: float) -> dict:
    """Profile a numeric column."""
    clean = series.dropna()
    return {
        "name": name,
        "dtype": dtype_str,
        "null_count": null_count,
        "null_rate": null_rate,
        "mean": round(float(clean.mean()), 4) if len(clean) > 0 else None,
        "median": round(float(clean.median()), 4) if len(clean) > 0 else None,
        "std": round(float(clean.std()), 4) if len(clean) > 1 else None,
        "min": round(float(clean.min()), 4) if len(clean) > 0 else None,
        "max": round(float(clean.max()), 4) if len(clean) > 0 else None,
        "p25": round(float(clean.quantile(0.25)), 4) if len(clean) > 0 else None,
        "p75": round(float(clean.quantile(0.75)), 4) if len(clean) > 0 else None,
        "unique_count": int(clean.nunique()),
    }


def _profile_categorical(series: pd.Series, name: str, dtype_str: str, null_count: int, null_rate: float) -> dict:
    """Profile a categorical/string column."""
    clean = series.dropna()
    value_counts = clean.value_counts().head(10)
    top_values = [
        {"value": str(val), "count": int(count)}
        for val, count in value_counts.items()
    ]
    return {
        "name": name,
        "dtype": dtype_str,
        "null_count": null_count,
        "null_rate": null_rate,
        "unique_count": int(clean.nunique()),
        "top_values": top_values,
    }


def _profile_datetime(series: pd.Series, name: str, null_count: int, null_rate: float) -> dict:
    """Profile a datetime column."""
    clean = series.dropna()
    if len(clean) == 0:
        return {
            "name": name,
            "dtype": "datetime64",
            "null_count": null_count,
            "null_rate": null_rate,
            "min_date": None,
            "max_date": None,
            "date_range_days": 0,
        }

    min_date = clean.min()
    max_date = clean.max()
    date_range = (max_date - min_date).days if hasattr(max_date - min_date, "days") else 0

    return {
        "name": name,
        "dtype": "datetime64",
        "null_count": null_count,
        "null_rate": null_rate,
        "min_date": str(min_date.isoformat()) if hasattr(min_date, "isoformat") else str(min_date),
        "max_date": str(max_date.isoformat()) if hasattr(max_date, "isoformat") else str(max_date),
        "date_range_days": int(date_range),
    }


def _detect_anomalies(series: pd.Series, name: str, total_rows: int) -> list[str]:
    """Detect anomalies in a column."""
    anomalies = []
    null_count = int(series.isna().sum())
    null_rate = null_count / total_rows if total_rows > 0 else 0.0

    # High null rate (>20%)
    if null_rate > 0.2:
        anomalies.append(f"Column '{name}' has {null_rate:.0%} null values ({null_count} rows)")

    # Low variance (all identical values)
    clean = series.dropna()
    if len(clean) > 0 and clean.nunique() == 1:
        anomalies.append(f"Column '{name}' has only one unique value (low variance)")

    # Numeric outliers (>3 std deviations)
    if pd.api.types.is_numeric_dtype(series) and len(clean) > 2:
        mean = clean.mean()
        std = clean.std()
        if std > 0:
            outliers = clean[abs(clean - mean) > 3 * std]
            if len(outliers) > 0:
                anomalies.append(
                    f"Column '{name}' contains {len(outliers)} values > 3 standard deviations from mean"
                )

    # Inconsistent date formats (for object columns that look like dates)
    if series.dtype == "object" and len(clean) > 0:
        sample = clean.head(100)
        try:
            parsed = pd.to_datetime(sample, errors="coerce", infer_datetime_format=True)
            parse_rate = parsed.notna().sum() / len(sample)
            if 0.3 < parse_rate < 0.95:
                anomalies.append(f"Column '{name}' has mixed date formats (only {parse_rate:.0%} parseable)")
        except Exception:
            pass

    return anomalies
