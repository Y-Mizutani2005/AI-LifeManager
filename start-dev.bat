@echo off
echo ========================================
echo   AI Project Companion - Dev Server
echo ========================================
echo.
echo Starting development servers...
echo.

REM バックエンドサーバー起動（仮想環境をルートでアクティベート→backendへ移動）
echo [1/2] Starting Backend Server...
start "Backend Server" cmd /k "call venv\Scripts\activate.bat && cd backend && uvicorn main:app --reload"

REM 少し待機（バックエンドが先に起動するように）
timeout /t 2 /nobreak > nul

REM フロントエンドサーバー起動
echo [2/2] Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Backend Server  : http://localhost:8000
echo ✅ Frontend Server : http://localhost:5173
echo.
echo 📝 Backend logs  → "Backend Server" window
echo 📝 Frontend logs → "Frontend Server" window
echo.
echo ⚠️  Stop servers: Close the respective windows or press Ctrl+C in each window
echo.
echo Press any key to exit this launcher...
pause > nul