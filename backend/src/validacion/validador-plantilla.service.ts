import { Injectable } from '@nestjs/common';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';

// Buscar el archivo en diferentes ubicaciones (dev vs production)
let schemaPath = path.join(__dirname, '../../plantilla-esquema.json');
if (!fs.existsSync(schemaPath)) {
  // Si no está en dist, buscar en la raíz del proyecto
  schemaPath = path.join(process.cwd(), 'plantilla-esquema.json');
}
if (!fs.existsSync(schemaPath)) {
  // Si aún no está, buscar en dist desde la raíz
  schemaPath = path.join(process.cwd(), 'dist', 'plantilla-esquema.json');
}
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

export interface ErrorValidacion {
  campo: string;
  mensaje: string;
  tipo: 'error' | 'warning';
}

@Injectable()
export class ValidadorPlantillaService {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
  }

  /**
   * Valida la estructura JSON según el schema
   */
  validarEstructura(configuracion: any): { valido: boolean; errores: ErrorValidacion[] } {
    const validate = this.ajv.compile(schema);
    const valido = validate(configuracion);
    const errores: ErrorValidacion[] = [];

    if (!valido && validate.errors) {
      for (const error of validate.errors) {
        errores.push({
          campo: error.instancePath || error.schemaPath,
          mensaje: this.traducirError(error.message || 'Error de validación'),
          tipo: 'error',
        });
      }
    }

    return { valido, errores };
  }

  /**
   * Valida semántica: IDs únicos, referencias válidas, etc.
   */
  validarSemantica(configuracion: any): { valido: boolean; errores: ErrorValidacion[]; warnings: ErrorValidacion[] } {
    const errores: ErrorValidacion[] = [];
    const warnings: ErrorValidacion[] = [];

    // Validar al menos una pregunta inicial
    const preguntasIniciales = configuracion.preguntas?.filter((p: any) => p.esInicial) || [];
    if (preguntasIniciales.length === 0) {
      errores.push({
        campo: 'preguntas',
        mensaje: 'Debe haber al menos una pregunta marcada como inicial',
        tipo: 'error',
      });
    }

    // Validar IDs únicos en preguntas
    const idsPreguntas = configuracion.preguntas?.map((p: any) => p.id) || [];
    const idsDuplicados = idsPreguntas.filter((id: string, index: number) => idsPreguntas.indexOf(id) !== index);
    if (idsDuplicados.length > 0) {
      errores.push({
        campo: 'preguntas',
        mensaje: `IDs duplicados en preguntas: ${idsDuplicados.join(', ')}`,
        tipo: 'error',
      });
    }

    // Validar referencias en transiciones
    const idsPreguntasSet = new Set(idsPreguntas);
    for (const transicion of configuracion.transiciones || []) {
      if (!idsPreguntasSet.has(transicion.desdePreguntaId)) {
        errores.push({
          campo: 'transiciones',
          mensaje: `Transición referencia pregunta inexistente: ${transicion.desdePreguntaId}`,
          tipo: 'error',
        });
      }

      for (const siguienteId of transicion.siguientesPreguntas || []) {
        if (!idsPreguntasSet.has(siguienteId)) {
          errores.push({
            campo: 'transiciones',
            mensaje: `Transición referencia siguiente pregunta inexistente: ${siguienteId}`,
            tipo: 'error',
          });
        }
      }
    }

    // Validar referencias en resultados
    for (const resultado of configuracion.resultados || []) {
      for (const condicion of resultado.condiciones || []) {
        if (!idsPreguntasSet.has(condicion.preguntaId)) {
          errores.push({
            campo: 'resultados',
            mensaje: `Resultado referencia pregunta inexistente: ${condicion.preguntaId}`,
            tipo: 'error',
          });
        }
      }
    }

    // Warnings: prioridades duplicadas en transiciones
    const prioridadesTransiciones = (configuracion.transiciones || []).map((t: any) => ({
      id: t.id,
      desde: t.desdePreguntaId,
      prioridad: t.prioridad,
    }));
    const prioridadesPorPregunta = new Map<string, number[]>();
    for (const trans of prioridadesTransiciones) {
      if (!prioridadesPorPregunta.has(trans.desde)) {
        prioridadesPorPregunta.set(trans.desde, []);
      }
      prioridadesPorPregunta.get(trans.desde)?.push(trans.prioridad);
    }
    for (const [preguntaId, prioridades] of prioridadesPorPregunta.entries()) {
      const duplicados = prioridades.filter((p, i) => prioridades.indexOf(p) !== i);
      if (duplicados.length > 0) {
        warnings.push({
          campo: 'transiciones',
          mensaje: `Pregunta ${preguntaId} tiene transiciones con prioridades duplicadas`,
          tipo: 'warning',
        });
      }
    }

    // Warnings: preguntas huérfanas (no referenciadas en transiciones ni son iniciales)
    const preguntasReferenciadas = new Set<string>();
    for (const transicion of configuracion.transiciones || []) {
      for (const siguienteId of transicion.siguientesPreguntas || []) {
        preguntasReferenciadas.add(siguienteId);
      }
    }
    for (const pregunta of configuracion.preguntas || []) {
      if (!pregunta.esInicial && !preguntasReferenciadas.has(pregunta.id)) {
        warnings.push({
          campo: 'preguntas',
          mensaje: `Pregunta ${pregunta.id} no es inicial ni está referenciada en ninguna transición`,
          tipo: 'warning',
        });
      }
    }

    // Validar maxDepth (detección de ciclos potenciales)
    const maxDepth = configuracion.datosBasicos?.maxDepth || 50;
    // Esta validación se hace mejor en tiempo de ejecución, aquí solo verificamos que maxDepth sea razonable
    if (maxDepth > 50) {
      warnings.push({
        campo: 'datosBasicos.maxDepth',
        mensaje: 'maxDepth muy alto puede causar problemas de rendimiento',
        tipo: 'warning',
      });
    }

    return {
      valido: errores.length === 0,
      errores,
      warnings,
    };
  }

  /**
   * Valida completamente una configuración
   */
  validarCompleta(configuracion: any): {
    valido: boolean;
    errores: ErrorValidacion[];
    warnings: ErrorValidacion[];
  } {
    const estructura = this.validarEstructura(configuracion);
    const semantica = this.validarSemantica(configuracion);

    return {
      valido: estructura.valido && semantica.valido,
      errores: [...estructura.errores, ...semantica.errores],
      warnings: semantica.warnings,
    };
  }

  private traducirError(mensaje: string): string {
    const traducciones: Record<string, string> = {
      "must be string": "debe ser texto",
      "must be number": "debe ser número",
      "must be boolean": "debe ser verdadero o falso",
      "must be array": "debe ser una lista",
      "must be object": "debe ser un objeto",
      "must have required property": "falta la propiedad requerida",
      "must match exactly one schema": "debe cumplir exactamente un esquema",
      "must match a schema in anyOf": "debe cumplir al menos un esquema",
    };

    for (const [key, value] of Object.entries(traducciones)) {
      if (mensaje.includes(key)) {
        return mensaje.replace(key, value);
      }
    }

    return mensaje;
  }
}

