@echo off
setlocal
cd /d "%~dp0"
title Project Gantt Tracker - Publish

node scripts\publish.cjs

echo.
pause
