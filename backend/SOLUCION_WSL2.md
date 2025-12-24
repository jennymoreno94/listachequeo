# 🚀 Solución Definitiva: Usar WSL2 (Windows Subsystem for Linux)

## Por qué WSL2 es la mejor solución

Prisma **NO tiene soporte nativo para Windows ARM64**. WSL2 ejecuta Linux dentro de Windows, donde Prisma funciona perfectamente en ARM64.

## 📋 Pasos para Instalar y Configurar WSL2

### 1. Instalar WSL2

Abre PowerShell como **Administrador** y ejecuta:

```powershell
wsl --install
```

Esto instalará WSL2 con Ubuntu por defecto. Reinicia tu computadora cuando termine.

### 2. Configurar WSL2

Después de reiniciar, se abrirá una terminal de Ubuntu. Configura un usuario y contraseña.

### 3. Instalar Node.js en WSL2

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+ (usando nvm - recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Instalar Node.js
nvm install 20
nvm use 20
```

### 4. Copiar el Proyecto a WSL2

Desde PowerShell (Windows):
```powershell
# El proyecto está en C:\Users\jenny\checklist-system
# En WSL2 estará en /mnt/c/Users/jenny/checklist-system
```

O copiar a una ubicación más conveniente:
```bash
# En WSL2
cp -r /mnt/c/Users/jenny/checklist-system ~/checklist-system
cd ~/checklist-system/backend
```

### 5. Instalar Dependencias en WSL2

```bash
cd ~/checklist-system/backend
npm install
npm run db:generate
```

### 6. Ejecutar el Backend

```bash
npm run dev
```

¡El backend funcionará perfectamente! 🎉

## 🔄 Acceso desde Windows

El backend en WSL2 será accesible desde Windows en `http://localhost:3000` - funciona automáticamente.

## 📝 Ventajas de WSL2

- ✅ Prisma funciona nativamente en Linux ARM64
- ✅ Mejor rendimiento que emulación
- ✅ Mismo puerto localhost funciona en ambos sistemas
- ✅ Acceso directo a archivos de Windows desde Linux
- ✅ Compatibilidad completa con todas las herramientas Node.js

## ⚡ Alternativa Rápida: Docker (si prefieres)

Si no quieres instalar WSL2, puedes usar Docker:

```bash
# Crear Dockerfile en backend/
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

```bash
docker build -t checklist-backend .
docker run -p 3000:3000 --env-file .env checklist-backend
```

## 🎯 Recomendación Final

**WSL2 es la solución más simple y confiable** para tu caso. Es la forma oficial de Microsoft para ejecutar herramientas Linux en Windows, y Prisma funciona perfectamente ahí.

