#!/bin/bash
# Script de configuración para WSL2
# Ejecutar en WSL2 después de instalar Node.js

echo "🚀 Configurando backend en WSL2..."
echo ""

# Navegar al directorio del backend
cd ~/checklist-system/backend 2>/dev/null || cd /mnt/c/Users/jenny/checklist-system/backend

if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json"
    echo "Asegúrate de estar en el directorio correcto"
    exit 1
fi

echo "📦 Instalando dependencias..."
npm install

echo ""
echo "🔧 Generando Prisma Client..."
npm run db:generate

echo ""
echo "✅ Configuración completada!"
echo ""
echo "Para iniciar el backend, ejecuta:"
echo "  cd ~/checklist-system/backend"
echo "  npm run dev"
echo ""
echo "El backend estará disponible en: http://localhost:3000"

