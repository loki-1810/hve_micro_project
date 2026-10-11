@echo off
echo ========================================================
echo   Starting Data Collection for Machine Learning Project
echo ========================================================
echo.

:: Start Flask Backend Server in a new window
echo [1/2] Starting Flask Backend on port 5000...
start "ML DataPrep - Flask Backend" cmd /k "cd backend && python app.py"

:: Wait 2 seconds for backend to initialize
timeout /t 2 /nobreak >nul

:: Start Vite Frontend Server in a new window
echo [2/2] Starting React Vite Frontend on port 5173...
start "ML DataPrep - React Frontend" cmd /k "cd frontend && npm run dev"

:: Wait 3 seconds then open default browser
timeout /t 3 /nobreak >nul
echo Opening http://localhost:5173 in your default browser...
start http://localhost:5173

echo.
echo Application is now running!
echo Backend:  http://127.0.0.1:5000
echo Frontend: http://localhost:5173
echo.
pause
