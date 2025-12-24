# Notas sobre Row Level Security (RLS) en Supabase

## ¿Qué es RLS?

Row Level Security (RLS) es una característica de seguridad de PostgreSQL que permite controlar el acceso a nivel de fila en las tablas. En Supabase, esto es importante para proteger tus datos cuando expones las tablas públicamente.

## Estado Actual

Las advertencias que ves en Supabase Security Advisor indican que RLS está **deshabilitado** en las siguientes tablas:
- `_prisma_migrations`
- `plantillas`
- `plantilla_borradores`
- `plantilla_versiones`
- `ejecuciones`
- `respuestas`
- `deshacer_snapshots`

## ¿Es un problema?

### Para Desarrollo:
**No es crítico** - Puedes continuar desarrollando sin habilitar RLS si:
- Tu base de datos no está expuesta públicamente
- Solo tú y tu equipo tienen acceso
- Estás usando la conexión directa de PostgreSQL (no la API pública de Supabase)

### Para Producción:
**Sí es importante** - Deberías habilitar RLS si:
- Vas a exponer la API pública de Supabase
- Múltiples usuarios tendrán acceso a la aplicación
- Necesitas controlar quién puede ver/modificar qué datos

## Cómo Habilitar RLS (Opcional - Solo si lo necesitas)

### Opción 1: Desde el Dashboard de Supabase

1. Ve a **Authentication > Policies** en Supabase
2. Selecciona cada tabla
3. Haz clic en **"Enable RLS"**
4. Crea políticas según tus necesidades

### Opción 2: Usando SQL

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE plantillas ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantilla_borradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantilla_versiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE ejecuciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE respuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE deshacer_snapshots ENABLE ROW LEVEL SECURITY;

-- Ejemplo de política (permitir todo para desarrollo)
CREATE POLICY "Enable all access for all users" ON plantillas
FOR ALL USING (true) WITH CHECK (true);
```

**Nota:** Si habilitas RLS, necesitarás crear políticas apropiadas, o de lo contrario nadie podrá acceder a las tablas (incluyendo tu aplicación).

## Recomendación

**Para este proyecto en desarrollo:** Puedes ignorar estas advertencias por ahora. Cuando estés listo para producción, habilitarás RLS con las políticas apropiadas.

