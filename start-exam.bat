@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo SKCT 온라인 모의고사 서버를 시작합니다...
echo 브라우저가 열리지 않으면 http://127.0.0.1:5173 으로 접속하세요.
start "" "http://127.0.0.1:5173/"
npm run dev -- --port 5173 --host 127.0.0.1
pause
