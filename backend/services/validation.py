import pandas as pd
import numpy as np

def infer_column_type(series: pd.Series) -> str:
    """Classify column into ML-relevant semantic types: numerical, categorical, boolean, text."""
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    if pd.api.types.is_numeric_dtype(series):
        # If integer with very few unique values, could be categorical, but we keep numeric for stats
        return "numerical"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    
    # Non-null values check
    non_null = series.dropna()
    if len(non_null) > 0:
        unique_ratio = non_null.nunique() / len(non_null)
        if unique_ratio > 0.8 and len(non_null) > 30:
            return "text"
    return "categorical"

def validate_dataframe(df: pd.DataFrame) -> dict:
    """
    Performs comprehensive data validation for machine learning readiness.
    Detects missing values, duplicates, column types, and generates understandable issue reports.
    """
    if df is None or df.empty:
        return {
            "is_valid": False,
            "error": "Dataset is empty or has no records.",
            "total_rows": 0,
            "total_columns": 0,
            "quality_score": 0,
            "issues": [
                {
                    "type": "danger",
                    "category": "empty_dataset",
                    "title": "Empty Dataset",
                    "description": "The provided dataset does not contain any records to validate.",
                    "suggestion": "Upload a CSV file containing at least 2 rows with a header."
                }
            ],
            "columns": [],
            "numerical_columns": [],
            "categorical_columns": [],
            "duplicate_rows_count": 0,
            "duplicate_percentage": 0.0,
            "total_missing_cells": 0,
            "overall_missing_percentage": 0.0
        }

    total_rows = int(len(df))
    total_cols = int(len(df.columns))
    total_cells = total_rows * total_cols

    # Duplicate rows detection
    duplicate_mask = df.duplicated()
    duplicate_count = int(duplicate_mask.sum())
    duplicate_pct = round((duplicate_count / total_rows) * 100, 2) if total_rows > 0 else 0.0

    # Column inspection
    columns_info = []
    numerical_cols = []
    categorical_cols = []
    total_missing_cells = 0
    issues = []

    for col in df.columns:
        series = df[col]
        missing_count = int(series.isna().sum())
        missing_pct = round((missing_count / total_rows) * 100, 2) if total_rows > 0 else 0.0
        total_missing_cells += missing_count

        col_type = infer_column_type(series)
        if col_type == "numerical":
            numerical_cols.append(col)
        else:
            categorical_cols.append(col)

        unique_vals_count = int(series.nunique(dropna=True))
        sample_vals = series.dropna().unique()[:3].tolist()
        # Ensure json serializable
        clean_samples = [str(v) for v in sample_vals]

        col_details = {
            "name": str(col),
            "dtype": str(series.dtype),
            "inferred_type": col_type,
            "missing_count": missing_count,
            "missing_percentage": missing_pct,
            "unique_values_count": unique_vals_count,
            "samples": clean_samples
        }
        columns_info.append(col_details)

        # Generate column-level issues
        if missing_count > 0:
            severity = "danger" if missing_pct > 25 else "warning"
            suggestion = (
                "Fill with mean or median if normally distributed, or drop rows."
                if col_type == "numerical"
                else "Fill with mode (most frequent) or a 'Missing' category placeholder."
            )
            issues.append({
                "type": severity,
                "category": "missing_values",
                "column": str(col),
                "title": f"Missing values in '{col}'",
                "description": f"Found {missing_count} missing values ({missing_pct}% of total rows).",
                "suggestion": suggestion,
                "count": missing_count
            })

    # Dataset-level issues: Duplicates
    if duplicate_count > 0:
        issues.append({
            "type": "warning",
            "category": "duplicate_rows",
            "column": None,
            "title": f"Duplicate rows detected ({duplicate_count} rows)",
            "description": f"{duplicate_count} exact duplicate rows ({duplicate_pct}%) found. Duplicates bias machine learning training data and test evaluations.",
            "suggestion": "Remove duplicate rows before feature engineering.",
            "count": duplicate_count
        })

    # Compute overall Data Quality Score (0 to 100)
    missing_pct_overall = round((total_missing_cells / total_cells) * 100, 2) if total_cells > 0 else 0.0
    
    # Penalty calculation
    # e.g., 10% missing cells deducts 20 points, duplicates deduct proportional points
    missing_penalty = min(missing_pct_overall * 2.0, 50.0)
    duplicate_penalty = min(duplicate_pct * 1.5, 30.0)
    quality_score = max(0, round(100.0 - missing_penalty - duplicate_penalty, 1))

    if len(issues) == 0:
        issues.append({
            "type": "info",
            "category": "clean",
            "column": None,
            "title": "High Data Quality",
            "description": "No missing values or duplicate rows detected. This dataset is clean and ready for ML processing.",
            "suggestion": "Proceed directly to dataset exploration or export."
        })

    return {
        "is_valid": True,
        "total_rows": total_rows,
        "total_columns": total_cols,
        "total_cells": total_cells,
        "quality_score": quality_score,
        "total_missing_cells": total_missing_cells,
        "overall_missing_percentage": missing_pct_overall,
        "duplicate_rows_count": duplicate_count,
        "duplicate_percentage": duplicate_pct,
        "columns": columns_info,
        "numerical_columns": numerical_cols,
        "categorical_columns": categorical_cols,
        "issues": issues
    }
