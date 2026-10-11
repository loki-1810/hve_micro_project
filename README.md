# Data Collection for Machine Learning

**A Final-Year B.Tech Artificial Intelligence and Data Science College Micro-Project**

---

## 1. Project Overview & Objectives

In practical machine learning projects, raw data is rarely ready for model training. Real-world datasets routinely suffer from missing observations, duplicated samples, inconsistent data types, and unverified distributions. Feeding unverified or corrupted data into machine learning algorithms (such as Scikit-Learn estimators, XGBoost, or PyTorch neural networks) results in biased parameter estimation, data leakage, or catastrophic runtime exceptions.

**“Data Collection for Machine Learning”** is a complete, developer-grade web application engineered to bridge the critical gap between raw data ingestion and model training. It allows students, data scientists, and ML engineers to:
1. **Ingest data** via CSV uploads, interactive manual data entry, or bundled real-world benchmark datasets.
2. **Audit data quality** through automated heuristic inspection (detecting column-level missingness, duplicate rows, data types, and computing an overarching Health Score).
3. **Preprocess and clean data non-destructively** (imputing missing values via mean/median/mode/custom constants or listwise row deletion, and removing exact duplicate records).
4. **Conduct exploratory data analysis (EDA)** with interactive numerical histograms, categorical frequency charts, descriptive statistics summaries, and feature correlation matrices.
5. **Export ML-ready artifacts**, downloading cleaned CSV files and structured JSON quality audit reports.

---

## 2. Key Features

- **Executive Dashboard**: Live session tracking displaying total ingested datasets, processed records, quality defects detected, and cleaned datasets with a visual ML lifecycle pipeline.
- **Multimodal Data Collection**:
  - **CSV File Upload**: Safe parsing supporting UTF-8, Latin-1, and Windows CP1252 encodings with a 10MB limit.
  - **Interactive Manual Table Grid**: Dynamic in-browser spreadsheet allowing students to add columns, add/remove rows, and simulate dirty data (nulls/duplicates).
  - **Bundled Benchmark Datasets**:
    - *Student Exam Performance* (Regression / 50 rows / 8 features): contains study hours, attendance, parental education, missing values, and duplicates.
    - *Residential Real Estate Valuation* (Regression / 42 rows / 7 features): square footage, bedrooms, location type, price, missing values, and duplicate listings.
- **Automated Data Quality Audit**:
  - Numerical health score calculation ($0 - 100\%$).
  - Actionable diagnostic recommendations tailored to machine learning risks.
  - Granular schema breakdown: inferred ML type (`numerical` vs. `categorical`), raw dtype, null counts, null percentages, unique values, and sample values.
- **Non-Destructive Data Cleaning**:
  - Preserves the raw original dataset in memory/session while generating an isolated clean variant.
  - Remove duplicate instances with 1 click.
  - Flexible missing value remediation:
    - *Auto Statistical Imputation*: numerical $\to$ median (robust to outliers), categorical $\to$ mode.
    - *Listwise Row Deletion*: drops records containing missing values.
    - *Custom Per-Column Matrix*: individual selection of mean, median, mode, constant value, or deletion.
  - Before-and-After audit trail detailing exact records dropped and transformations applied.
- **Exploratory Data Analysis (EDA)**:
  - Toggle seamlessly between *Raw Data* and *Cleaned Data* to observe how cleaning affected distributions.
  - Interactive numerical distribution histograms (binned frequencies via Recharts).
  - Categorical class frequency bar charts.
  - Descriptive statistics table (Count, Mean, Std Dev, Min, Q1 25%, Median 50%, Q3 75%, Max, Skewness).
  - Pairwise Pearson Correlation matrix ($r$) with heat-map intensity to detect collinearity.
  - Full-featured paginated table browser with real-time value filtering.
- **Export Center**:
  - Export original CSV file.
  - Export cleaned ML-ready CSV file.
  - Export comprehensive Data Quality & Preprocessing Audit JSON report.
- **Local Persistence & Privacy**:
  - **Zero database dependency** (no SQLite, MongoDB, PostgreSQL, Firebase, or cloud storage required).
  - Session state maintained in lightweight browser storage (`localStorage` and `sessionStorage`).

---

## 3. Technology Stack

- **Frontend**:
  - **React 18** with **Vite**
  - **Vanilla CSS Design System**: Custom developer-tool aesthetic (light neutral palette, slate text, crisp borders, responsive flex/grid layouts, no decorative bloat)
  - **Recharts**: Responsive charting library for distribution histograms and category frequencies
  - **Lucide React**: Clean developer iconography
- **Backend**:
  - **Python 3.11+**
  - **Flask 3.1+** with **Flask-CORS**
  - **Pandas 3.0+** & **NumPy 2.4+**: High-performance in-memory tabular data manipulation and statistical profiling
- **Storage**:
  - Browser memory and HTML5 Web Storage (`sessionStorage` and `localStorage`).
  - In-memory DataFrame transformations on the backend.

---

## 4. Folder Structure

```
hve_micro_project/
├── backend/
│   ├── app.py                      # Flask REST API server with 10 endpoints
│   ├── requirements.txt            # Python dependencies (Flask, Flask-CORS, Pandas, NumPy)
│   ├── test_backend.py             # Pipeline unit tests for validation & cleaning
│   ├── test_api_endpoints.py       # Full end-to-end integration tests for all API endpoints
│   ├── sample_data/
│   │   ├── student_performance.csv # Student performance sample dataset with nulls/duplicates
│   │   └── house_prices.csv        # Property pricing sample dataset with nulls/duplicates
│   └── services/
│       ├── __init__.py
│       ├── validation.py           # Missingness, duplicate detection, and health score logic
│       ├── cleaning.py             # Non-destructive imputation & duplicate removal
│       └── analysis.py             # Stats, histogram binning, correlations, and previews
├── frontend/
│   ├── index.html                  # HTML entry point with Inter & JetBrains Mono typography
│   ├── package.json                # React, Vite, Recharts, Lucide-react
│   ├── vite.config.js              # Vite config with proxy to backend port 5000
│   └── src/
│       ├── main.jsx                # React root mount
│       ├── App.jsx                 # Main state coordinator and page router
│       ├── index.css               # Clean developer-tool design system & CSS variables
│       ├── components/
│       │   ├── Sidebar.jsx         # Fixed left navigation with active issue badges
│       │   ├── Header.jsx          # Top status bar with active dataset chip
│       │   ├── StatCard.jsx        # Metric summary card
│       │   ├── DataTable.jsx       # Paginated table with search & null highlight
│       │   └── AlertBanner.jsx     # Contextual status & recommendation banner
│       ├── pages/
│       │   ├── Dashboard.jsx       # Session metrics & ML workflow overview
│       │   ├── CollectData.jsx     # Sample selection, CSV upload & manual grid
│       │   ├── DataQuality.jsx     # Quality health meter & column audit report
│       │   ├── CleanDataset.jsx    # Preprocessing forms, before/after audit & preview
│       │   ├── ExploreData.jsx     # Histograms, descriptive stats & correlations
│       │   └── DatasetHistory.jsx  # Export center & session history log
│       └── services/
│           ├── api.js              # HTTP client communicating with Flask backend
│           └── storage.js          # Browser localStorage / sessionStorage manager
├── .gitignore                      # Python and Node build artifacts ignore
└── README.md                       # Comprehensive documentation & review guide
```

---

## 5. Prerequisites

Before running the application on Windows, verify that the following tools are installed:

- **Python 3.10+** (verified on Python 3.11)
  Check: `python --version`
- **Node.js 18+** (verified on Node v24)
  Check: `node --version`
- **npm** (comes bundled with Node.js)
  Check: `npm --version`

---

## 6. Windows Setup & Installation Instructions

Open **PowerShell** or **Command Prompt** in the project root directory:

### Step 1: Install Backend Dependencies

```powershell
cd backend
python -m pip install -r requirements.txt
```

### Step 2: Install Frontend Dependencies

```powershell
cd ..\frontend
npm install
```

---

## 7. Running the Application

To run the application locally, you will start the Flask backend server and the React Vite development server.

### Terminal 1: Run Flask Backend (Port 5000)

```powershell
cd backend
python app.py
```
*The backend will start on:* `http://127.0.0.1:5000`

### Terminal 2: Run React Frontend (Port 5173)

```powershell
cd frontend
npm run dev
```
*The frontend will start on:* `http://localhost:5173`

Open your web browser and navigate to **`http://localhost:5173`**.

---

## 8. College Review Demonstration Workflow

During a project review, follow this step-by-step demonstration:

1. **Dashboard Overview**:
   - Open `http://localhost:5173`.
   - Point out the clean layout: top metric cards, session indicators, and the ML data lifecycle diagram.
2. **Data Collection**:
   - Click **Collect Data** in the sidebar.
   - Click **Load Dataset** on the **Student Exam Performance** sample card.
   - Explain to the examiner: *"This dataset contains 50 records tracking academic performance metrics. It intentionally includes missing study hours and duplicate student rows to simulate real-world data collection flaws."*
3. **Data Quality Audit**:
   - The app automatically navigates to **Data Quality**.
   - Show the **Health Score (88.5 / 100)**.
   - Point out the 2 detected duplicate records and 11 missing cells.
   - Explain the machine learning implications: *"Duplicate samples distort gradient updates and bias loss functions, while missing values cause standard Scikit-Learn estimators to fail."*
4. **Data Cleaning**:
   - Click **Proceed to Clean Data**.
   - Select **Remove exact duplicate rows** and **Auto Statistical Imputation**.
   - Click **Apply Cleaning Operations**.
   - Show the **Before & After Cleaning Audit**:
     - Row count safely dropped from 50 to 48 (2 duplicates eliminated).
     - Missing cells resolved from 11 to 0 (imputed with medians and modes).
     - Health score improved from 88.5% to **100%**.
     - Emphasize to the reviewer: *"The original raw dataset is preserved completely intact in memory; the cleaned dataset is created non-destructively."*
5. **Exploratory Data Analysis (EDA)**:
   - Click **Explore Data**.
   - Toggle between **Raw Data** and **Cleaned Data** to demonstrate the difference.
   - Select features in the **Histogram** dropdown to view frequency distributions.
   - Switch to the **Descriptive Statistics** tab to inspect means, standard deviations, quartiles, and skewness.
   - Switch to the **Feature Correlation Matrix** tab to inspect pairwise Pearson correlation coefficients ($r$) for multicollinearity detection.
6. **Export Center & History**:
   - Navigate to **Dataset History**.
   - Click **Download Cleaned CSV** to download the clean ML-ready dataset (`student_exam_performance_cleaned.csv`).
   - Click **Download Summary JSON** to download the audit report (`student_exam_performance_quality_report.json`).
   - Open the downloaded CSV to prove to the reviewer that it contains actual preprocessed records.

---

## 9. Verification & Testing

Both automated unit and integration tests have been implemented and executed:

```powershell
# 1. Run backend unit tests (Validates dataframe logic & cleaning algorithms)
cd backend
python test_backend.py

# 2. Run API integration tests (Validates all 10 REST endpoints live)
python test_api_endpoints.py

# 3. Test production frontend build
cd ..\frontend
npm run build
```

**Test Results:**
- `test_backend.py`: All validation heuristics, duplicate detection, auto-imputation, and analysis functions executed and passed.
- `test_api_endpoints.py`: All 10 live endpoints (`GET /api/health`, `GET /api/samples`, `GET /api/samples/<id>`, `POST /api/manual`, `POST /api/validate`, `POST /api/clean`, `POST /api/analyze`, `POST /api/export/csv`, `POST /api/export/json`, `POST /api/upload`) tested and passed.
- `npm run build`: Vite bundled production client with 0 errors.

---

## 10. Design Decisions & Limitations

- **No Database by Design**: The project intentionally does not use SQL or NoSQL databases. ML data preparation workflows are exploratory and session-driven; browser local storage and backend in-memory processing provide rapid iteration without external infrastructure overhead.
- **In-Memory Scale**: Designed for typical micro-project datasets (up to 10MB / ~100,000 rows). Datasets exceeding memory capacity would require distributed engines like PySpark in production.
- **Data Persistence**: Because storage is local to the user's browser, clearing browser site data will reset session history.
