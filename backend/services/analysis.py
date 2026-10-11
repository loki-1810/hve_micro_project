import pandas as pd
import numpy as np

def clean_for_json(val):
    """Safely converts pandas/numpy values (NaN, inf) into JSON-compatible formats."""
    if pd.isna(val) or val is None:
        return None
    if isinstance(val, (np.floating, float)):
        if np.isinf(val) or np.isnan(val):
            return None
        return round(float(val), 4)
    if isinstance(val, (np.integer, int)):
        return int(val)
    if isinstance(val, (np.bool_, bool)):
        return bool(val)
    return str(val)

def generate_histograms(df: pd.DataFrame, numerical_cols: list, max_bins: int = 10) -> dict:
    """Computes histogram bins for numerical features formatted for Recharts."""
    histograms = {}
    for col in numerical_cols:
        series = pd.to_numeric(df[col], errors='coerce').dropna()
        if len(series) < 2:
            continue
        try:
            min_val = float(series.min())
            max_val = float(series.max())
            if min_val == max_val:
                histograms[col] = [{
                    "range": f"{round(min_val, 2)}",
                    "bin_start": min_val,
                    "bin_end": max_val,
                    "count": len(series)
                }]
                continue

            counts, bin_edges = np.histogram(series, bins=min(max_bins, max(3, int(len(series) / 4))))
            bins_data = []
            for i in range(len(counts)):
                b_start = round(float(bin_edges[i]), 2)
                b_end = round(float(bin_edges[i+1]), 2)
                bins_data.append({
                    "range": f"{b_start} - {b_end}",
                    "bin_start": b_start,
                    "bin_end": b_end,
                    "count": int(counts[i])
                })
            histograms[col] = bins_data
        except Exception:
            continue
    return histograms

def generate_categorical_counts(df: pd.DataFrame, categorical_cols: list, top_k: int = 8) -> dict:
    """Computes category frequencies for categorical bar charts."""
    cat_counts = {}
    for col in categorical_cols:
        series = df[col].astype(str).replace({"nan": "(Missing)", "None": "(Missing)"})
        counts = series.value_counts(dropna=False).head(top_k)
        chart_data = [{"category": str(k), "count": int(v)} for k, v in counts.items()]
        cat_counts[col] = chart_data
    return cat_counts

def calculate_correlations(df: pd.DataFrame, numerical_cols: list) -> dict:
    """Calculates pairwise Pearson correlation for numerical features."""
    if len(numerical_cols) < 2:
        return {"columns": numerical_cols, "matrix": []}
    
    # Filter numerical dataframe
    sub_df = df[numerical_cols].apply(pd.to_numeric, errors='coerce')
    corr = sub_df.corr().fillna(0.0)
    
    matrix = []
    for col_y in numerical_cols:
        row_items = []
        for col_x in numerical_cols:
            val = corr.loc[col_y, col_x] if (col_y in corr.index and col_x in corr.columns) else 0.0
            row_items.append({
                "x": str(col_x),
                "y": str(col_y),
                "value": round(float(val), 3)
            })
        matrix.append({"column": str(col_y), "values": row_items})
        
    return {
        "columns": numerical_cols,
        "matrix": matrix
    }

def analyze_dataframe(df: pd.DataFrame) -> dict:
    """
    Computes statistical metrics, column profiles, distribution bins, and correlations.
    """
    if df is None or df.empty:
        return {"error": "Cannot analyze an empty dataset."}

    total_rows = int(len(df))
    total_cols = int(len(df.columns))

    numerical_cols = []
    categorical_cols = []

    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            numerical_cols.append(col)
        else:
            categorical_cols.append(col)

    # 1. Numerical Descriptive Statistics
    num_stats = {}
    for col in numerical_cols:
        series = pd.to_numeric(df[col], errors='coerce').dropna()
        if len(series) > 0:
            num_stats[col] = {
                "count": int(len(series)),
                "missing": int(df[col].isna().sum()),
                "mean": clean_for_json(series.mean()),
                "std": clean_for_json(series.std()),
                "min": clean_for_json(series.min()),
                "p25": clean_for_json(series.quantile(0.25)),
                "median": clean_for_json(series.median()),
                "p75": clean_for_json(series.quantile(0.75)),
                "max": clean_for_json(series.max()),
                "skew": clean_for_json(series.skew()) if len(series) > 2 else 0.0
            }

    # 2. Categorical Summary
    cat_summary = {}
    for col in categorical_cols:
        series = df[col].dropna()
        cat_summary[col] = {
            "count": int(len(series)),
            "missing": int(df[col].isna().sum()),
            "unique": int(series.nunique()),
            "top": str(series.mode().iloc[0]) if not series.empty else "N/A",
            "top_freq": int(series.value_counts().iloc[0]) if not series.empty else 0
        }

    # 3. Chart Visualizations Data
    histograms = generate_histograms(df, numerical_cols)
    categorical_charts = generate_categorical_counts(df, categorical_cols)
    correlations = calculate_correlations(df, numerical_cols)

    # 4. Preview Table (first 100 rows, sanitized for JSON)
    preview_df = df.head(100).copy()
    preview_records = []
    for _, row in preview_df.iterrows():
        record = {str(k): clean_for_json(v) for k, v in row.items()}
        preview_records.append(record)

    return {
        "total_rows": total_rows,
        "total_columns": total_cols,
        "numerical_columns": numerical_cols,
        "categorical_columns": categorical_cols,
        "numerical_statistics": num_stats,
        "categorical_statistics": cat_summary,
        "histograms": histograms,
        "categorical_charts": categorical_charts,
        "correlations": correlations,
        "preview_records": preview_records,
        "columns": [str(c) for c in df.columns]
    }
