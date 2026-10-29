@echo off
title StockAgent Terminal Launcher
echo ========================================================
echo   StockAgent Terminal - Multi-Agent Simulator Dashboard
echo ========================================================
echo.

echo [1/2] Starting Flask REST API Backend (Port 5000)...
start "StockAgent API (:5000)" cmd /k "cd api && python app.py"

echo [2/2] Starting React Vite Frontend (Port 5173)...
start "StockAgent Frontend (:5173)" cmd /k "cd dashboard && npm run dev"

echo.
echo ========================================================
echo   Servers successfully initiated!
echo   - Web Dashboard:  http://localhost:5173
echo   - REST API Feed:  http://localhost:5000/api/summary
echo ========================================================
echo.
pause
