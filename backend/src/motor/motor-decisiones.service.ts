import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PreguntaVisible {
  preguntaId: string;
  texto: string;
  tipo: string;
  opciones?: Array<{ value: string; label: string }>;
  validaciones?: any;
  esInicial: boolean;
}

export interface RespuestaInvalida {
  preguntaId: string;
  texto: string;
}

@Injectable()
export class MotorDecisionesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene el camino visible de preguntas para una ejecución
   */
  async obtenerCaminoVisible(ejecucionId: string): Promise<PreguntaVisible[]> {
    const ejecucion = await this.prisma.ejecucion.findUnique({
      where: { id: ejecucionId },
      include: {
        plantillaVersion: true,
        respuestas: {
          where: { esValida: true },
        },
      },
    });

    if (!ejecucion) {
      throw new Error('Ejecución no encontrada');
    }

    const config = ejecucion.plantillaVersion.configuracion as any;
    const respuestasValidas = this.mapearRespuestas(ejecucion.respuestas);

    // Empezar desde preguntas iniciales
    const preguntasIniciales = config.preguntas.filter((p: any) => p.esInicial);
    const caminoVisible = new Set<string>();
    const visitadas = new Set<string>();

    // BFS desde preguntas iniciales
    const cola: string[] = [...preguntasIniciales.map((p: any) => p.id)];

    while (cola.length > 0) {
      const preguntaId = cola.shift()!;
      if (visitadas.has(preguntaId)) continue;
      visitadas.add(preguntaId);

      caminoVisible.add(preguntaId);

      // Obtener siguientes preguntas según transiciones
      const siguientes = this.obtenerSiguientesPreguntas(
        config,
        preguntaId,
        respuestasValidas,
      );

      for (const siguienteId of siguientes) {
        if (!visitadas.has(siguienteId)) {
          cola.push(siguienteId);
        }
      }
    }

    // Mapear a objetos completos
    return config.preguntas
      .filter((p: any) => caminoVisible.has(p.id))
      .map((p: any) => ({
        preguntaId: p.id,
        texto: p.texto,
        tipo: p.tipo,
        opciones: p.opciones,
        validaciones: p.validaciones,
        esInicial: p.esInicial,
      }));
  }

  /**
   * Obtiene las siguientes preguntas según transiciones evaluadas
   */
  obtenerSiguientesPreguntas(
    config: any,
    preguntaId: string,
    respuestasValidas: Map<string, any>,
  ): string[] {
    const transiciones = (config.transiciones || []).filter(
      (t: any) => t.desdePreguntaId === preguntaId,
    );

    if (transiciones.length === 0) {
      return [];
    }

    // Ordenar por prioridad (mayor primero)
    transiciones.sort((a: any, b: any) => b.prioridad - a.prioridad);

    const respuesta = respuestasValidas.get(preguntaId);
    const siguientes = new Set<string>();

    // Evaluar transiciones en orden de prioridad
    for (const transicion of transiciones) {
      if (transicion.esDefault) {
        // Default solo se aplica si ninguna otra coincide
        continue;
      }

      if (this.evaluarCondicion(transicion.operador, respuesta, transicion.valor)) {
        for (const siguienteId of transicion.siguientesPreguntas) {
          siguientes.add(siguienteId);
        }
        // Si encontramos una coincidencia, no evaluamos las de menor prioridad
        break;
      }
    }

    // Si ninguna coincidió, buscar default
    if (siguientes.size === 0) {
      const transicionDefault = transiciones.find((t: any) => t.esDefault);
      if (transicionDefault) {
        for (const siguienteId of transicionDefault.siguientesPreguntas) {
          siguientes.add(siguienteId);
        }
      }
    }

    return Array.from(siguientes);
  }

  /**
   * Aplica una respuesta y recalcula el camino visible
   */
  async aplicarRespuestaYRecalcular(
    ejecucionId: string,
    preguntaId: string,
    valor: any,
  ): Promise<{
    caminoVisible: PreguntaVisible[];
    siguientesPreguntas: string[];
    respuestasInvalidadas: RespuestaInvalida[];
  }> {
    // Guardar snapshot para deshacer (30 segundos)
    const ejecucion = await this.prisma.ejecucion.findUnique({
      where: { id: ejecucionId },
      include: { respuestas: true },
    });

    if (!ejecucion) {
      throw new Error('Ejecución no encontrada');
    }

    // Crear snapshot antes del cambio
    const snapshot = {
      respuestas: ejecucion.respuestas.map((r) => ({
        preguntaId: r.preguntaId,
        valor: r.valor,
        esValida: r.esValida,
      })),
    };

    const expiraEn = new Date(Date.now() + 30000); // 30 segundos

    await this.prisma.deshacerSnapshot.create({
      data: {
        ejecucionId,
        expiraEn,
        payload: snapshot as any,
      },
    });

    // Invalidar respuestas anteriores de esta pregunta
    await this.prisma.respuesta.updateMany({
      where: {
        ejecucionId,
        preguntaId,
        esValida: true,
      },
      data: {
        esValida: false,
        invalidadaEn: new Date(),
      },
    });

    // Guardar nueva respuesta
    await this.prisma.respuesta.create({
      data: {
        ejecucionId,
        preguntaId,
        valor: valor as any,
        esValida: true,
      },
    });

    // Recalcular camino visible
    const config = (await this.prisma.plantillaVersion.findUnique({
      where: { id: ejecucion.plantillaVersionId },
    }))!.configuracion as any;

    const respuestasActuales = await this.prisma.respuesta.findMany({
      where: { ejecucionId, esValida: true },
    });

    const respuestasValidas = this.mapearRespuestas(respuestasActuales);
    const nuevoCamino = await this.obtenerCaminoVisible(ejecucionId);

    // Invalidar respuestas fuera del nuevo camino
    const idsCaminoVisible = new Set(nuevoCamino.map((p) => p.preguntaId));
    const respuestasFuera = respuestasActuales.filter(
      (r) => !idsCaminoVisible.has(r.preguntaId),
    );

    const respuestasInvalidadas: RespuestaInvalida[] = [];

    for (const respuesta of respuestasFuera) {
      if (respuesta.preguntaId !== preguntaId) {
        // No invalidar la que acabamos de responder
        const pregunta = config.preguntas.find((p: any) => p.id === respuesta.preguntaId);
        if (pregunta) {
          await this.prisma.respuesta.update({
            where: { id: respuesta.id },
            data: {
              esValida: false,
              invalidadaEn: new Date(),
            },
          });

          respuestasInvalidadas.push({
            preguntaId: respuesta.preguntaId,
            texto: pregunta.texto,
          });
        }
      }
    }

    // Obtener siguientes preguntas
    const siguientesPreguntas = this.obtenerSiguientesPreguntas(
      config,
      preguntaId,
      respuestasValidas,
    );

    return {
      caminoVisible: nuevoCamino,
      siguientesPreguntas,
      respuestasInvalidadas,
    };
  }

  /**
   * Deshace el último cambio usando el snapshot más reciente
   */
  async deshacerUltimoCambio(ejecucionId: string): Promise<boolean> {
    const snapshot = await this.prisma.deshacerSnapshot.findFirst({
      where: {
        ejecucionId,
        expiraEn: { gt: new Date() }, // Solo snapshots no expirados
      },
      orderBy: { creadaEn: 'desc' },
    });

    if (!snapshot) {
      return false;
    }

    const payload = snapshot.payload as any;

    // Eliminar todas las respuestas actuales
    await this.prisma.respuesta.deleteMany({
      where: { ejecucionId },
    });

    // Restaurar respuestas del snapshot
    for (const respuesta of payload.respuestas || []) {
      await this.prisma.respuesta.create({
        data: {
          ejecucionId,
          preguntaId: respuesta.preguntaId,
          valor: respuesta.valor,
          esValida: respuesta.esValida,
        },
      });
    }

    // Eliminar snapshot usado
    await this.prisma.deshacerSnapshot.delete({
      where: { id: snapshot.id },
    });

    return true;
  }

  /**
   * Calcula los resultados (outcomes) aplicables para una ejecución
   */
  async calcularResultados(ejecucionId: string): Promise<any[]> {
    const ejecucion = await this.prisma.ejecucion.findUnique({
      where: { id: ejecucionId },
      include: {
        plantillaVersion: true,
        respuestas: {
          where: { esValida: true },
        },
      },
    });

    if (!ejecucion) {
      throw new Error('Ejecución no encontrada');
    }

    const config = ejecucion.plantillaVersion.configuracion as any;
    const respuestasValidas = this.mapearRespuestas(ejecucion.respuestas);

    // Ordenar resultados por prioridad (mayor primero)
    const resultados = [...(config.resultados || [])].sort(
      (a: any, b: any) => b.prioridad - a.prioridad,
    );

    const resultadosAplicables: any[] = [];

    for (const resultado of resultados) {
      // Evaluar todas las condiciones (AND)
      let todasCumplen = true;

      for (const condicion of resultado.condiciones || []) {
        const respuesta = respuestasValidas.get(condicion.preguntaId);
        const cumple = this.evaluarCondicion(
          condicion.operador,
          respuesta,
          condicion.valor,
        );

        if (!cumple) {
          todasCumplen = false;
          break;
        }
      }

      if (todasCumplen) {
        resultadosAplicables.push(resultado);
      }
    }

    return resultadosAplicables;
  }

  /**
   * Evalúa una condición según el operador
   */
  private evaluarCondicion(operador: string, respuesta: any, valorEsperado: any): boolean {
    if (operador === 'IS_EMPTY') {
      return respuesta === null || respuesta === undefined || respuesta === '';
    }

    if (operador === 'IS_NOT_EMPTY') {
      return respuesta !== null && respuesta !== undefined && respuesta !== '';
    }

    if (respuesta === null || respuesta === undefined) {
      return false;
    }

    switch (operador) {
      case 'EQUALS':
        return respuesta === valorEsperado;
      case 'NOT_EQUALS':
        return respuesta !== valorEsperado;
      case 'IN':
        return Array.isArray(valorEsperado) && valorEsperado.includes(respuesta);
      case 'GT':
        return Number(respuesta) > Number(valorEsperado);
      case 'LT':
        return Number(respuesta) < Number(valorEsperado);
      case 'GTE':
        return Number(respuesta) >= Number(valorEsperado);
      case 'LTE':
        return Number(respuesta) <= Number(valorEsperado);
      default:
        return false;
    }
  }

  /**
   * Mapea respuestas a un Map para acceso rápido
   */
  private mapearRespuestas(respuestas: any[]): Map<string, any> {
    const mapa = new Map<string, any>();
    for (const respuesta of respuestas) {
      // El valor puede estar en formato JSON, extraer el valor real
      let valor = respuesta.valor;
      if (typeof valor === 'object' && valor !== null) {
        // Si es objeto, intentar extraer el valor
        valor = valor.value !== undefined ? valor.value : valor;
      }
      mapa.set(respuesta.preguntaId, valor);
    }
    return mapa;
  }
}

