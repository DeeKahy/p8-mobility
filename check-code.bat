@echo off
setlocal

set FAILED=0

call :run "lint" "npm.cmd run lint"
call :run "lint:fix" "npm.cmd run lint:fix"
call :run "format" "npm.cmd run format"
call :run "format:check" "npm.cmd run format:check"
call :run "type-check" "npm.cmd run type-check"
call :run "ci:check" "npm.cmd run ci:check"

if %FAILED% NEQ 0 goto failed

echo.
echo Done.
exit /b 0

:run
echo.
echo =========================
echo Running %~1
echo =========================
call %~2
if %ERRORLEVEL% NEQ 0 set FAILED=1
exit /b 0

:failed
echo.
echo =========================
echo SCRIPT FAILED
echo =========================
exit /b 1
