import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Crear plantilla "Revisión de Nevera"
  const plantilla = await prisma.plantilla.create({
    data: {
      nombre: 'Revisión de Nevera',
      descripcion: 'Checklist para revisar el estado de neveras en campo',
      estado: 'BORRADOR',
    },
  });

  console.log(`✅ Plantilla creada: ${plantilla.id}`);

  // Configuración completa según el caso demo
  const configuracion = {
    datosBasicos: {
      nombre: 'Revisión de Nevera',
      descripcion: 'Checklist para revisar el estado de neveras en campo',
      duracionEstimada: 15,
      allowBacktrack: true,
      maxDepth: 10,
      exigirRespuestas: true,
    },
    preguntas: [
      {
        id: 'p1',
        texto: 'Estado de la puerta de la nevera',
        tipo: 'UNA_OPCION',
        opciones: [
          { value: 'rota', label: 'Rota' },
          { value: 'sumida', label: 'Sumida' },
          { value: 'rayada', label: 'Rayada' },
          { value: 'buena', label: 'Buena' },
        ],
        validaciones: {
          requerido: true,
        },
        esInicial: true,
      },
      {
        id: 'p2',
        texto: 'URL de foto',
        tipo: 'FOTO_URL',
        validaciones: {
          requerido: true,
        },
        esInicial: false,
      },
      {
        id: 'p3',
        texto: '¿La puerta cierra correctamente?',
        tipo: 'UNA_OPCION',
        opciones: [
          { value: 'si', label: 'Sí' },
          { value: 'no', label: 'No' },
        ],
        validaciones: {
          requerido: true,
        },
        esInicial: false,
      },
      {
        id: 'p4',
        texto: 'Causa probable',
        tipo: 'TEXTO',
        validaciones: {
          requerido: true,
        },
        esInicial: false,
      },
      {
        id: 'p5',
        texto: '¿Afecta el cierre?',
        tipo: 'UNA_OPCION',
        opciones: [
          { value: 'si', label: 'Sí' },
          { value: 'no', label: 'No' },
        ],
        validaciones: {
          requerido: true,
        },
        esInicial: false,
      },
      {
        id: 'p6',
        texto: 'Estado del sello',
        tipo: 'UNA_OPCION',
        opciones: [
          { value: 'good', label: 'Bueno' },
          { value: 'worn', label: 'Desgastado' },
          { value: 'damaged', label: 'Dañado' },
        ],
        validaciones: {
          requerido: true,
        },
        esInicial: false,
      },
      {
        id: 'p7',
        texto: 'Severidad de las rayaduras',
        tipo: 'UNA_OPCION',
        opciones: [
          { value: 'superficial', label: 'Superficial' },
          { value: 'profunda', label: 'Profunda' },
        ],
        validaciones: {
          requerido: true,
        },
        esInicial: false,
      },
      {
        id: 'p8',
        texto: '¿El cliente quiere reparación estética?',
        tipo: 'UNA_OPCION',
        opciones: [
          { value: 'si', label: 'Sí' },
          { value: 'no', label: 'No' },
        ],
        validaciones: {
          requerido: true,
        },
        esInicial: false,
      },
      {
        id: 'p9',
        texto: 'Temperatura actual (°C)',
        tipo: 'NUMERO',
        validaciones: {
          requerido: true,
          min: -10,
          max: 15,
        },
        esInicial: false,
      },
    ],
    transiciones: [
      {
        id: 't1',
        desdePreguntaId: 'p1',
        operador: 'EQUALS',
        valor: 'rota',
        siguientesPreguntas: ['p2', 'p3', 'p4'],
        prioridad: 10,
        esDefault: false,
      },
      {
        id: 't2',
        desdePreguntaId: 'p1',
        operador: 'EQUALS',
        valor: 'sumida',
        siguientesPreguntas: ['p5', 'p6'],
        prioridad: 10,
        esDefault: false,
      },
      {
        id: 't3',
        desdePreguntaId: 'p1',
        operador: 'EQUALS',
        valor: 'rayada',
        siguientesPreguntas: ['p7', 'p8'],
        prioridad: 10,
        esDefault: false,
      },
      {
        id: 't4',
        desdePreguntaId: 'p1',
        operador: 'EQUALS',
        valor: 'buena',
        siguientesPreguntas: ['p6', 'p9'],
        prioridad: 10,
        esDefault: false,
      },
    ],
    resultados: [
      {
        id: 'r1',
        nombre: 'Puerta rota - Escalar y pedir repuesto',
        prioridad: 100,
        condiciones: [
          {
            preguntaId: 'p1',
            operador: 'EQUALS',
            valor: 'rota',
          },
          {
            preguntaId: 'p3',
            operador: 'EQUALS',
            valor: 'no',
          },
        ],
        acciones: [
          {
            tipo: 'ESCALATE',
            payload: {
              nivel: 'alto',
              motivo: 'Puerta rota que no cierra',
            },
          },
          {
            tipo: 'ORDER_PART',
            payload: {
              parte: 'Puerta de nevera',
              urgencia: 'alta',
            },
          },
        ],
      },
      {
        id: 'r2',
        nombre: 'Sumida afecta cierre - Reemplazar sello y seguimiento',
        prioridad: 90,
        condiciones: [
          {
            preguntaId: 'p1',
            operador: 'EQUALS',
            valor: 'sumida',
          },
          {
            preguntaId: 'p5',
            operador: 'EQUALS',
            valor: 'si',
          },
          {
            preguntaId: 'p6',
            operador: 'IN',
            valor: ['worn', 'damaged'],
          },
        ],
        acciones: [
          {
            tipo: 'ORDER_PART',
            payload: {
              parte: 'Sello de puerta',
              urgencia: 'media',
            },
          },
          {
            tipo: 'SCHEDULE_FOLLOWUP',
            payload: {
              dias: 7,
              motivo: 'Verificar instalación de sello',
            },
          },
        ],
      },
      {
        id: 'r3',
        nombre: 'Rayaduras superficiales - No crítico',
        prioridad: 50,
        condiciones: [
          {
            preguntaId: 'p1',
            operador: 'EQUALS',
            valor: 'rayada',
          },
          {
            preguntaId: 'p7',
            operador: 'EQUALS',
            valor: 'superficial',
          },
          {
            preguntaId: 'p8',
            operador: 'EQUALS',
            valor: 'no',
          },
        ],
        acciones: [
          {
            tipo: 'LOG',
            payload: {
              nivel: 'info',
              mensaje: 'Rayaduras superficiales, cliente no requiere reparación estética',
            },
          },
        ],
      },
      {
        id: 'r4',
        nombre: 'Estado óptimo - Todo en orden',
        prioridad: 80,
        condiciones: [
          {
            preguntaId: 'p1',
            operador: 'EQUALS',
            valor: 'buena',
          },
          {
            preguntaId: 'p6',
            operador: 'EQUALS',
            valor: 'good',
          },
          {
            preguntaId: 'p9',
            operador: 'GTE',
            valor: 2,
          },
          {
            preguntaId: 'p9',
            operador: 'LTE',
            valor: 8,
          },
        ],
        acciones: [
          {
            tipo: 'LOG',
            payload: {
              nivel: 'success',
              mensaje: 'Nevera en estado óptimo: puerta buena, sello en buen estado, temperatura correcta',
            },
          },
        ],
      },
    ],
  };

  // Calcular checksum
  const configString = JSON.stringify(configuracion);
  const checksum = crypto.createHash('sha256').update(configString).digest('hex');

  // Publicar versión 1
  const version = await prisma.plantillaVersion.create({
    data: {
      plantillaId: plantilla.id,
      version: 1,
      configuracion: configuracion as any,
      checksum,
    },
  });

  // Actualizar estado a PUBLICADA
  await prisma.plantilla.update({
    where: { id: plantilla.id },
    data: { estado: 'PUBLICADA' },
  });

  console.log(`✅ Versión 1 publicada: ${version.id}`);
  console.log(`✅ Plantilla actualizada a estado: PUBLICADA`);
  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

