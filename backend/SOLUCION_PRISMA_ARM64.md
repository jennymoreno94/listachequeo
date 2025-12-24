# Solución para Prisma en Windows ARM64

## Problema

El error `query_engine-windows.dll.node is not a valid Win32 application` ocurre porque:
- Tu sistema es **Windows ARM64** (Windows on ARM)
- Prisma estaba intentando usar un binario x64 incompatible

## Solución Aplicada

1. **Versión de Prisma**: Se fijó en **5.22.0** (versión estable compatible)
2. **Binary Target**: Se usa `native` (detecta automáticamente ARM64)
3. **Limpieza**: Se eliminó el cache corrupto de Prisma

## Si el Problema Persiste

Ejecuta estos comandos en orden:

```bash
cd backend

# 1. Limpiar completamente
rmdir /s /q node_modules\.prisma
rmdir /s /q node_modules\@prisma

# 2. Reinstalar versión correcta
npm install prisma@5.22.0 @prisma/client@5.22.0 --save-exact --force

# 3. Regenerar
npm run db:generate

# 4. Probar
npm run dev
```

## Verificación

Si Prisma funciona correctamente, deberías poder ejecutar:
```bash
node -e "const { PrismaClient } = require('@prisma/client'); console.log('OK');"
```

Sin errores.

