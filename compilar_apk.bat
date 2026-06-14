@echo off
echo ============================================
echo   Compilador APK - APP-Dieta Mediterranea
echo ============================================
echo.

REM Verificar si Node.js esta instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js no esta instalado o no esta en el PATH
    echo Por favor, instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo [1/5] Verificando Node.js...
node --version
echo.

echo [2/5] Construyendo frontend web...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Fallo la compilacion del frontend
    pause
    exit /b 1
)
echo.

echo [3/5] Sincronizando con Capacitor Android...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Fallo la sincronizacion con Capacitor
    pause
    exit /b 1
)
echo.

echo [4/5] Compilando APK con Gradle...
echo.
echo ============================================
echo   COMPILANDO APK - ESTO PUEDE TOMAR VARIOS MINUTOS
echo ============================================
echo.

cd android
call gradlew assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Fallo la compilacion del APK
    cd ..
    pause
    exit /b 1
)
cd ..

echo [5/5] Verificando APK generado...
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo.
    echo ============================================
    echo   APK COMPILADO EXITOSAMENTE
    echo ============================================
    echo.
    echo   Ubicacion del APK:
    echo   android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo   Puedes instalarlo directamente en tu dispositivo Android
    echo.
    echo ============================================
) else (
    echo.
    echo ERROR: No se encontro el archivo APK generado
    echo.
    echo Por favor, verifica que Gradle se haya ejecutado correctamente
    echo.
)

REM Preguntar si desea abrir Android Studio opcionalmente
echo.
set /p OPEN_STUDIO=¿Deseas abrir Android Studio? (S/N): 
if /i "%OPEN_STUDIO%"=="S" (
    where studio64 >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo Abriendo Android Studio...
        start "" "studio64" "%CD%\android"
    ) else (
        echo NOTA: Android Studio no se encontro en el PATH.
    )
)

echo.
echo Proceso completado.
pause