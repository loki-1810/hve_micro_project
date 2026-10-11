import os
import sys
import pandas as pd
from services.validation import validate_dataframe
from services.cleaning import clean_dataframe
from services.analysis import analyze_dataframe

def test_pipeline():
    print("=== Testing Data Processing Pipeline ===")
    sample_path = os.path.join(os.path.dirname(__file__), "sample_data", "student_performance.csv")
    assert os.path.exists(sample_path), "Sample file does not exist!"
    
    df = pd.read_csv(sample_path)
    print(f"Loaded sample: {len(df)} rows, {len(df.columns)} columns.")

    # 1. Validation test
    val = validate_dataframe(df)
    assert val["is_valid"] is True
    print(f"Validation successful: Quality Score = {val['quality_score']}/100")
    print(f"Missing cells = {val['total_missing_cells']}, Duplicates = {val['duplicate_rows_count']}")
    assert val["duplicate_rows_count"] > 0, "Expected duplicates in sample dataset"
    assert val["total_missing_cells"] > 0, "Expected missing values in sample dataset"

    # 2. Cleaning test
    rules = {
        "remove_duplicates": True,
        "global_missing_strategy": "impute_auto"
    }
    cleaned_df, summary = clean_dataframe(df, rules)
    print(f"Cleaned dataset: {len(cleaned_df)} rows. Duplicates removed: {summary['duplicates_removed']}.")
    print(f"Remaining missing cells: {summary['final_missing_cells']}")
    assert summary["duplicates_removed"] > 0
    assert summary["final_missing_cells"] == 0

    # 3. Post-clean validation test
    val_cleaned = validate_dataframe(cleaned_df)
    print(f"Post-cleaning Quality Score: {val_cleaned['quality_score']}/100")
    assert val_cleaned["quality_score"] == 100.0

    # 4. Analysis test
    analysis = analyze_dataframe(cleaned_df)
    assert "numerical_statistics" in analysis
    assert "histograms" in analysis
    assert "categorical_charts" in analysis
    assert "correlations" in analysis
    print("Analysis test passed: Histograms and correlations generated successfully.")
    print("=== All Pipeline Tests Passed! ===")

if __name__ == "__main__":
    test_pipeline()
