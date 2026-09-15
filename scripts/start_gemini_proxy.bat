@echo off
title Gemini Web2API Proxy Server (Port 8081)
cd /d "%~dp0\gemini_web2api"
echo ============================================================
echo   Starting Gemini Web2API Server on http://localhost:8081
echo   OpenAI Compatible: http://localhost:8081/v1
echo   Google Compatible: http://localhost:8081/v1beta
echo ============================================================
python -m pip install -q httpx
python gemini_web2api.py --port 8081
pause
