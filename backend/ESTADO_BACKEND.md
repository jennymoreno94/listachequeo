# Estado del Backend

## ✅ Cambios Completados

1. **Restricción Única en Base de Datos**
   - Se agregó `@unique` al campo `nombre` en el modelo `Plantilla`
   - Migración aplicada con `prisma db push`

2. **Manejo de Errores**
   - El servicio `PlantillasService.crear()` ahora captura errores de Prisma
   - Devuelve `ConflictException` con mensaje claro cuando el nombre ya existe
   - Código de error: P2002 (violación de restricción única)

3. **Archivo plantilla-esquema.json**
   - Script agregado para copiar automáticamente después del build
   - Se ejecuta en `npm run build`
   - Ubicación: `backend/scripts/copy-schema.js`

4. **Dependencias**
   - `class-validator` y `class-transformer` instalados
   - Necesarios para `ValidationPipe` en NestJS

## ⚠️ Estado Actual

El backend está configurado correctamente, pero puede tener problemas al iniciar debido a:

1. **Posible problema de Prisma Client**: El query engine puede tener problemas de compatibilidad en Windows
2. **Conexión a Base de Datos**: Verifica que `DATABASE_URL` en `.env` sea correcta
3. **Puerto en uso**: Asegúrate de que el puerto 3000 no esté bloqueado

## 🧪 Para Validar que Funciona

Cuando el backend esté ejecutándose, prueba:

```bash
# 1. Listar plantillas
curl http://localhost:3000/api/plantillas

# 2. Crear plantilla nueva
curl -X POST http://localhost:3000/api/plantillas \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Mi Plantilla","descripcion":"Descripción"}'

# 3. Intentar crear duplicado (debe fallar)
curl -X POST http://localhost:3000/api/plantillas \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Mi Plantilla","descripcion":"Duplicado"}'
```

## 📝 Notas

- Las advertencias de RLS en Supabase no afectan el funcionamiento (ver `RLS_NOTES.md`)
- El frontend está configurado para conectarse a `http://localhost:3000/api`

