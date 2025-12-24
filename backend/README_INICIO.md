# 🚀 Cómo Iniciar el Backend

## Opción 1: Script Automático (Recomendado)

Doble clic en: **`start-backend.bat`**

Este script:
- ✅ Verifica y copia el archivo JSON necesario
- ✅ Regenera Prisma Client si es necesario
- ✅ Inicia el servidor en modo desarrollo

## Opción 2: Manual

```bash
cd backend
npm run dev
```

## ✅ Verificar que Funciona

Una vez iniciado, deberías ver:
```
🚀 Backend ejecutándose en http://localhost:3000
```

Puedes probar en el navegador o con:
```bash
curl http://localhost:3000/api/plantillas
```

## 🔧 Solución de Problemas

### Error: "query_engine-windows.dll.node is not a valid Win32 application"

Ejecuta:
```bash
cd backend
npm run db:generate
```

### Error: "Cannot find module plantilla-esquema.json"

El script `start-backend.bat` lo soluciona automáticamente. O manualmente:
```bash
copy plantilla-esquema.json dist\plantilla-esquema.json
```

### El backend no responde

1. Verifica que el puerto 3000 no esté en uso
2. Revisa el archivo `.env` y confirma que `DATABASE_URL` sea correcta
3. Revisa la consola para ver errores específicos

