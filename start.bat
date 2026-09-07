@echo off
setlocal
cd /d "%~dp0"
title Project Gantt Tracker - Local Admin

echo ========================================================
echo        Project Gantt Tracker - Local Admin Mode
echo ========================================================
echo.
echo [1/3] Starting Local JSON Storage API...
start "Project Tracker Local API" /min node server.cjs

echo [2/3] Opening browser at http://localhost:5173...
start http://localhost:5173

echo [3/3] Starting Vite application...
echo.
echo ========================================================
echo  Application is running!
echo  Any edits you make will save to public\data\projects.json
echo  When finished, close this window or press Ctrl+C.
echo ========================================================
echo.

cmd /c "npm run dev"
