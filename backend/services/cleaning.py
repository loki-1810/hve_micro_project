import pandas as pd
import numpy as np

def clean_dataframe(df: pd.DataFrame, rules: dict) -> tuple[pd.DataFrame, dict]:
    """
    Applies user-selected cleaning operations to a pandas DataFrame.
    Returns the cleaned copy and a comprehensive audit summary of changes made.
    Does NOT modify the input dataframe in place.
    """
    if df is None or df.empty:
        return df, {"error": "Cannot clean an empty dataset."}

    # Work on an isolated copy
    cleaned = df.copy()

    initial_row_count = int(len(cleaned))
    initial_col_count = int(len(cleaned.columns))
    initial_missing_count = int(cleaned.isna().sum().sum())

    duplicates_removed = 0
    imputation_details = []

    # 1. Duplicate Removal
    remove_duplicates = rules.get("remove_duplicates", False)
    if remove_duplicates:
        duplicate_count = int(cleaned.duplicated().sum())
        if duplicate_count > 0:
            cleaned = cleaned.drop_duplicates().reset_index(drop=True)
            duplicates_removed = duplicate_count

    # 2. Missing Value Handling
    global_missing_strategy = rules.get("global_missing_strategy", "none")
    column_strategies = rules.get("column_strategies", {})

    if global_missing_strategy == "drop_rows":
        before_drop = len(cleaned)
        cleaned = cleaned.dropna().reset_index(drop=True)
        dropped_count = before_drop - len(cleaned)
        if dropped_count > 0:
            imputation_details.append({
                "column": "ALL",
                "action": "drop_rows",
                "count_affected": dropped_count,
                "note": f"Dropped {dropped_count} rows containing missing values across any column."
            })

    elif global_missing_strategy == "impute_auto":
        # Automatically impute: numeric -> median (robust to outliers), categorical -> mode
        for col in cleaned.columns:
            series = cleaned[col]
            missing_count = int(series.isna().sum())
            if missing_count > 0:
                if pd.api.types.is_numeric_dtype(series):
                    val = series.median()
                    # Handle if all values in col were NaN
                    if pd.isna(val):
                        val = 0
                    cleaned[col] = cleaned[col].fillna(val)
                    imputation_details.append({
                        "column": str(col),
                        "action": "median",
                        "value": round(float(val), 3) if isinstance(val, (int, float, np.number)) else str(val),
                        "count_affected": missing_count,
                        "note": f"Filled {missing_count} missing values with column median ({round(float(val), 2)})."
                    })
                else:
                    mode_series = series.mode()
                    val = mode_series.iloc[0] if not mode_series.empty else "Unknown"
                    cleaned[col] = cleaned[col].fillna(val)
                    imputation_details.append({
                        "column": str(col),
                        "action": "mode",
                        "value": str(val),
                        "count_affected": missing_count,
                        "note": f"Filled {missing_count} missing values with most frequent value ('{val}')."
                    })

    elif global_missing_strategy == "custom" or column_strategies:
        # Per-column strategy specified by user
        for col, col_rule in column_strategies.items():
            if col not in cleaned.columns:
                continue

            action = col_rule.get("action", "none")
            series = cleaned[col]
            missing_count = int(series.isna().sum())

            if missing_count == 0 or action == "none":
                continue

            if action == "drop_rows":
                before_drop = len(cleaned)
                cleaned = cleaned.dropna(subset=[col]).reset_index(drop=True)
                dropped = before_drop - len(cleaned)
                imputation_details.append({
                    "column": str(col),
                    "action": "drop_rows",
                    "count_affected": dropped,
                    "note": f"Dropped {dropped} rows missing '{col}'."
                })

            elif action == "mean" and pd.api.types.is_numeric_dtype(series):
                mean_val = series.mean()
                fill_val = round(float(mean_val), 3) if not pd.isna(mean_val) else 0.0
                cleaned[col] = cleaned[col].fillna(fill_val)
                imputation_details.append({
                    "column": str(col),
                    "action": "mean",
                    "value": fill_val,
                    "count_affected": missing_count,
                    "note": f"Filled {missing_count} values with mean ({fill_val})."
                })

            elif action == "median" and pd.api.types.is_numeric_dtype(series):
                med_val = series.median()
                fill_val = round(float(med_val), 3) if not pd.isna(med_val) else 0.0
                cleaned[col] = cleaned[col].fillna(fill_val)
                imputation_details.append({
                    "column": str(col),
                    "action": "median",
                    "value": fill_val,
                    "count_affected": missing_count,
                    "note": f"Filled {missing_count} values with median ({fill_val})."
                })

            elif action == "mode":
                mode_vals = series.mode()
                fill_val = mode_vals.iloc[0] if not mode_vals.empty else "Missing"
                cleaned[col] = cleaned[col].fillna(fill_val)
                imputation_details.append({
                    "column": str(col),
                    "action": "mode",
                    "value": str(fill_val),
                    "count_affected": missing_count,
                    "note": f"Filled {missing_count} values with mode ('{fill_val}')."
                })

            elif action == "constant":
                custom_val = col_rule.get("value", "")
                # Type cast if column is numeric
                if pd.api.types.is_numeric_dtype(series):
                    try:
                        custom_val = float(custom_val)
                    except (ValueError, TypeError):
                        custom_val = 0.0
                cleaned[col] = cleaned[col].fillna(custom_val)
                imputation_details.append({
                    "column": str(col),
                    "action": "constant",
                    "value": str(custom_val),
                    "count_affected": missing_count,
                    "note": f"Filled {missing_count} values with custom value '{custom_val}'."
                })

    final_row_count = int(len(cleaned))
    final_missing_count = int(cleaned.isna().sum().sum())
    rows_dropped_total = initial_row_count - final_row_count

    summary = {
        "initial_rows": initial_row_count,
        "final_rows": final_row_count,
        "rows_dropped": rows_dropped_total,
        "initial_columns": initial_col_count,
        "final_columns": int(len(cleaned.columns)),
        "duplicates_removed": duplicates_removed,
        "initial_missing_cells": initial_missing_count,
        "final_missing_cells": final_missing_count,
        "missing_cells_resolved": initial_missing_count - final_missing_count,
        "operations": imputation_details,
        "applied_rules": rules
    }

    return cleaned, summary
