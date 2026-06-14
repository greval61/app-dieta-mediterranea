@echo off
echo ========================================
echo   Iniciando APP-Dieta
echo ========================================
echo.

REM Verificar si Node.js esta instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js no esta instalado o no esta en el PATH
    echo Por favor, instala Node.js desde https://nodejs.org
    pause
    exit /b 1
)

echo [1/3] Instalando dependencias...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Fallo la instalacion de dependencias
    pause
    exit /b 1
)

echo.
echo [2/3] Iniciando servidor backend...
start "Servidor Backend" cmd /k "node server/index.js"

REM Esperar a que el servidor arranque
echo Esperando al servidor...
timeout /t 3 /nobreak >nul

echo.
echo [3/3] Iniciando frontend...
start "Frontend APP-Dieta" cmd /k "npm run dev"

echo.
echo ========================================
echo   Aplicacion iniciada correctamente
echo   - Backend: http://localhost:3001
echo   - Frontend: http://localhost:5173 (o el puerto que indique Vite)
echo ========================================
echo.
echo Para detener la aplicacion, cierra las ventanas de consola.
echo.
pause