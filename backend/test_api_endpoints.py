import urllib.request
import urllib.parse
import json
import io

BASE_URL = "http://127.0.0.1:5000"

def get(path):
    req = urllib.request.Request(f"{BASE_URL}{path}")
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode())

def post_json(path, data):
    body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}{path}", data=body, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        content_type = resp.headers.get('Content-Type', '')
        if 'application/json' in content_type:
            return resp.status, json.loads(resp.read().decode())
        else:
            return resp.status, resp.read().decode()

def test_full_api_workflow():
    print("=== Testing Live API Endpoints ===")

    # 1. Health check
    status, res = get("/api/health")
    assert status == 200 and res["status"] == "healthy"
    print("[PASS] GET /api/health passed")

    # 2. Get samples
    status, res = get("/api/samples")
    assert status == 200 and len(res["samples"]) >= 2
    print(f"[PASS] GET /api/samples passed ({len(res['samples'])} samples available)")

    # 3. Load sample dataset
    sample_id = "student_performance"
    status, res = get(f"/api/samples/{sample_id}")
    assert status == 200 and res["total_rows"] == 50
    assert "validation" in res
    assert res["validation"]["duplicate_rows_count"] == 2
    assert res["validation"]["total_missing_cells"] == 11
    print(f"[PASS] GET /api/samples/{sample_id} passed: {res['total_rows']} rows, Quality: {res['validation']['quality_score']}%")

    columns = res["columns"]
    rows = res["rows"]

    # 4. Manual entry endpoint
    manual_payload = {
        "name": "Live Test Data",
        "description": "Integration test payload",
        "columns": ["feature_a", "feature_b", "label"],
        "rows": [
            {"feature_a": 10, "feature_b": "X", "label": 1},
            {"feature_a": 20, "feature_b": "", "label": 0}, # missing
            {"feature_a": 10, "feature_b": "X", "label": 1}  # duplicate
        ]
    }
    status, m_res = post_json("/api/manual", manual_payload)
    assert status == 200 and m_res["total_rows"] == 3
    assert m_res["validation"]["duplicate_rows_count"] == 1
    print("[PASS] POST /api/manual passed")

    # 5. Validate endpoint
    status, v_res = post_json("/api/validate", {"columns": columns, "rows": rows})
    assert status == 200 and v_res["validation"]["is_valid"] is True
    print("[PASS] POST /api/validate passed")

    # 6. Clean endpoint with auto imputation & duplicate removal
    clean_payload = {
        "columns": columns,
        "rows": rows,
        "rules": {
            "remove_duplicates": True,
            "global_missing_strategy": "impute_auto"
        }
    }
    status, c_res = post_json("/api/clean", clean_payload)
    assert status == 200
    assert c_res["summary"]["duplicates_removed"] == 2
    assert c_res["summary"]["final_missing_cells"] == 0
    assert c_res["validation"]["quality_score"] == 100.0
    print(f"[PASS] POST /api/clean passed: rows {len(rows)} -> {len(c_res['cleaned_rows'])}, quality 100%")

    cleaned_columns = c_res["cleaned_columns"]
    cleaned_rows = c_res["cleaned_rows"]

    # 7. Analyze endpoint
    status, a_res = post_json("/api/analyze", {"columns": cleaned_columns, "rows": cleaned_rows})
    assert status == 200 and "analysis" in a_res
    analysis = a_res["analysis"]
    assert "study_hours" in analysis["histograms"]
    assert "gender" in analysis["categorical_charts"]
    assert len(analysis["correlations"]["matrix"]) > 0
    print("[PASS] POST /api/analyze passed: generated histograms, bar charts, and correlation matrix")

    # 8. Export CSV endpoint
    status, csv_text = post_json("/api/export/csv", {
        "columns": cleaned_columns,
        "rows": cleaned_rows,
        "filename": "test_cleaned.csv"
    })
    assert status == 200 and "student_id" in csv_text
    print(f"[PASS] POST /api/export/csv passed ({len(csv_text)} bytes returned)")

    # 10. File upload endpoint
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    csv_file_path = "sample_data/house_prices.csv"
    with open(csv_file_path, "r", encoding="utf-8") as f:
        csv_bytes = f.read()
    
    parts = [
        f"--{boundary}",
        'Content-Disposition: form-data; name="name"',
        "",
        "Uploaded Real Estate",
        f"--{boundary}",
        'Content-Disposition: form-data; name="description"',
        "",
        "Test house prices upload",
        f"--{boundary}",
        'Content-Disposition: form-data; name="file"; filename="house_prices.csv"',
        "Content-Type: text/csv",
        "",
        csv_bytes,
        f"--{boundary}--",
        ""
    ]
    multipart_body = "\r\n".join(parts).encode("utf-8")
    up_req = urllib.request.Request(
        f"{BASE_URL}/api/upload",
        data=multipart_body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    with urllib.request.urlopen(up_req) as up_resp:
        up_data = json.loads(up_resp.read().decode())
    assert up_data["total_rows"] == 42
    assert up_data["validation"]["duplicate_rows_count"] == 2
    print(f"[PASS] POST /api/upload passed: {up_data['name']} ({up_data['total_rows']} rows, Quality {up_data['validation']['quality_score']}%)")

    print("\nALL API AND BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_api_workflow()
