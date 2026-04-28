@echo off
setlocal

echo =========================
echo Uninstalling Android app
echo =========================
adb uninstall com.anonymous.p8mobility
echo Continuing even if uninstall failed...

echo =========================
echo Installing dependencies
echo =========================
call npm install
if %ERRORLEVEL% NEQ 0 goto failed

echo =========================
echo Expo prebuild clean
echo =========================
call npx expo prebuild --clean
if %ERRORLEVEL% NEQ 0 goto failed

echo =========================
echo Running Android
echo =========================
call npx expo run:android
if %ERRORLEVEL% NEQ 0 goto failed

echo =========================
echo Done!
echo =========================
exit /b 0

:failed
echo.
echo =========================
echo SCRIPT FAILED
echo =========================
echo Exit code: %ERRORLEVEL%
exit /b %ERRORLEVEL%