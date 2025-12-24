@echo off
echo ========================================
echo Iniciando Backend del Sistema
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Verificando archivo JSON...
if not exist "dist\plantilla-esquema.json" (
    echo Copiando plantilla-esquema.json...
    copy "plantilla-esquema.json" "dist\plantilla-esquema.json" >nul
    echo ✓ Archivo copiado
) else (
    echo ✓ Archivo JSON encontrado
)

echo.
echo [2/4] Regenerando Prisma Client...
call npm run db:generate >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Problema al generar Prisma Client
    echo Aplicando solucion para ARM64...
    call npm run fix-prisma >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: No se pudo solucionar Prisma Client
        echo Por favor ejecuta manualmente: npm run fix-prisma
        pause
        exit /b 1
    )
)
echo ✓ Prisma Client verificado

echo.
echo [3/4] Iniciando servidor...
echo.
echo ⚠ IMPORTANTE: Mantén esta ventana abierta
echo    El backend estara disponible en: http://localhost:3000
echo    Para detener el servidor presiona Ctrl+C
echo.
echo ========================================
echo.

call npm run dev

pause

