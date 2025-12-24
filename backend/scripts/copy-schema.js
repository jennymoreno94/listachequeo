const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '../plantilla-esquema.json');
const dest = path.join(__dirname, '../dist/plantilla-esquema.json');

// Crear directorio dist si no existe
const distDir = path.dirname(dest);
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copiar archivo
fs.copyFileSync(source, dest);
console.log('✓ plantilla-esquema.json copiado a dist');

