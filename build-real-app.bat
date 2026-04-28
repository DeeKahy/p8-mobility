@echo off
cd /d C:\p8-mobility

echo Cleaning old Android build files...
rmdir /s /q android\app\.cxx 2>nul
rmdir /s /q android\app\build 2>nul
rmdir /s /q android\.gradle 2>nul
rmdir /s /q node_modules\.cache 2>nul

echo Installing dependencies...
call npm install

echo Prebuilding Android clean...
call npx expo prebuild --platform android --clean

echo Enabling New Architecture...
powershell -Command "(Get-Content android\gradle.properties) -replace 'newArchEnabled=false','newArchEnabled=true' | Set-Content android\gradle.properties"

echo Building RELEASE APK...
cd android
call gradlew clean
call gradlew assembleRelease

IF NOT EXIST app\build\outputs\apk\release\app-release.apk (
  echo.
  echo BUILD FAILED - APK was not created.
  pause
  exit /b 1
)

cd ..

echo Uninstalling old app...
adb uninstall com.anonymous.p8mobility

echo Installing release APK...
adb install -r android\app\build\outputs\apk\release\app-release.apk

echo Launching app...
adb shell monkey -p com.anonymous.p8mobility -c android.intent.category.LAUNCHER 1

echo.
echo DONE
pause