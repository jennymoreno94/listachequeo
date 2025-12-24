# Sistema de Listas de Chequeo Dinámicas

Sistema completo para crear y ejecutar listas de chequeo con preguntas dinámicas basadas en respuestas del usuario. El sistema permite a administradores no técnicos crear plantillas complejas mediante un constructor visual, y a técnicos ejecutar estas listas viendo solo las preguntas relevantes según sus respuestas.

## 🏗️ Arquitectura

- **Backend**: NestJS + Prisma + PostgreSQL (Supabase)
- **Frontend**: React + Vite + TypeScript
- **Validación**: Ajv + JSON Schema Draft 2020-12
- **Estado**: Zustand
- **Formularios**: React Hook Form

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Cuenta de Supabase con base de datos PostgreSQL
- Conexión a Internet para instalar dependencias

## 🚀 Instalación y Configuración

### 1. Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env` basado en `.env.example`:

```env
DATABASE_URL="postgresql://usuario:password@db.xxxxx.supabase.co:5432/postgres?schema=public"
PORT=3000
NODE_ENV=development
```

### 2. Configurar Base de Datos

```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Poblar con datos de ejemplo (incluye "Revisión de Nevera")
npm run db:seed
```

### 3. Iniciar Backend

```bash
npm run dev
```

El backend estará disponible en `http://localhost:3000`

### 4. Configurar Frontend

```bash
cd ../frontend
npm install
```

### 5. Iniciar Frontend

```bash
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## 📁 Estructura del Proyecto

```
checklist-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Modelos de base de datos
│   │   └── seed.ts            # Datos de ejemplo
│   ├── src/
│   │   ├── motor/             # Motor de decisiones
│   │   ├── plantillas/        # CRUD de plantillas
│   │   ├── ejecuciones/        # API de ejecuciones
│   │   ├── validacion/        # Validación con Ajv
│   │   └── prisma/            # Servicio Prisma
│   └── plantilla-esquema.json # JSON Schema para validación
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Admin/          # Constructor visual
        │   └── Tecnico/        # Ejecutor de checklists
        ├── stores/             # Zustand stores
        ├── services/           # API client
        └── tests/              # Tests (incluye anti-JSON)
```

## 🎯 Funcionalidades Principales

### Admin UI (Constructor Visual)

1. **Datos Básicos**: Nombre, descripción, duración, configuración de navegación
2. **Preguntas**: CRUD visual con tipos (UNA_OPCION, MULTIPLES_OPCIONES, TEXTO, NUMERO, FOTO_URL, FECHA)
3. **Transiciones**: Reglas de navegación con operadores y prioridades
4. **Resultados**: Outcomes con condiciones AND y acciones (ESCALATE, ORDER_PART, etc.)
5. **Validar/Publicar**: Validación semántica, guardar borrador, publicar versiones inmutables

### Technician UI (Ejecutor)

1. **Iniciar Ejecución**: Seleccionar plantilla y versión publicada
2. **Navegación Dinámica**: Una pregunta por pantalla, camino visible calculado en tiempo real
3. **Retroceso**: Botón "Atrás" si `allowBacktrack` está habilitado
4. **Invalidación Inteligente**: Toast para 1-2 invalidaciones, modal para 3+, botón "Deshacer" (30s)
5. **Finalización**: Validación de requeridos y cálculo de resultados aplicables

## 🧪 Testing

```bash
cd frontend
npm test
```

Incluye test anti-JSON que verifica que no aparezcan controles de edición JSON en la UI del administrador.

## 📝 Caso Demo: "Revisión de Nevera"

El seed incluye una plantilla completa de ejemplo con:
- Pregunta inicial sobre estado de la puerta
- Transiciones condicionales según respuesta
- Múltiples resultados con diferentes acciones
- Listo para editar desde el constructor

## 🔒 Características de Seguridad

- Versiones inmutables con checksum SHA-256
- Validación semántica completa antes de publicar
- Snapshots para deshacer cambios (expiran en 30 segundos)
- Validación de referencias (IDs únicos, referencias válidas)

## 📚 Documentación Adicional

- **Validación**: El sistema valida estructura (JSON Schema) y semántica (referencias, ciclos, etc.)
- **Motor de Decisiones**: BFS desde preguntas iniciales, evaluación de transiciones por prioridad
- **Resultados**: Evaluación AND de condiciones, ordenados por prioridad

## 🐛 Solución de Problemas

### Error de conexión a base de datos
- Verifica que `DATABASE_URL` en `.env` sea correcta
- Asegúrate de que Supabase permita conexiones desde tu IP

### Error al ejecutar migraciones
- Verifica que Prisma Client esté generado: `npm run db:generate`
- Revisa que la base de datos esté accesible

### Frontend no se conecta al backend
- Verifica que el backend esté corriendo en puerto 3000
- Revisa la configuración de proxy en `vite.config.ts`

## 📄 Licencia

Este proyecto es privado y está destinado para uso interno.

