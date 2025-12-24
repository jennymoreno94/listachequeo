import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MotorDecisionesService } from '../motor/motor-decisiones.service';

@Injectable()
export class EjecucionesService {
  constructor(
    private prisma: PrismaService,
    private motor: MotorDecisionesService,
  ) {}

  async crear(data: { plantillaId: string; plantillaVersionId: string }) {
    const plantilla = await this.prisma.plantilla.findUnique({
      where: { id: data.plantillaId },
    });

    if (!plantilla) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    const version = await this.prisma.plantillaVersion.findUnique({
      where: { id: data.plantillaVersionId },
    });

    if (!version) {
      throw new NotFoundException('Versión no encontrada');
    }

    if (version.plantillaId !== data.plantillaId) {
      throw new BadRequestException('La versión no pertenece a la plantilla');
    }

    return this.prisma.ejecucion.create({
      data: {
        plantillaId: data.plantillaId,
        plantillaVersionId: data.plantillaVersionId,
        estado: 'EN_PROGRESO',
      },
      include: {
        plantilla: true,
        plantillaVersion: true,
      },
    });
  }

  async obtener(id: string) {
    const ejecucion = await this.prisma.ejecucion.findUnique({
      where: { id },
      include: {
        plantilla: true,
        plantillaVersion: true,
        respuestas: {
          where: { esValida: true },
          orderBy: { respondidaEn: 'asc' },
        },
      },
    });

    if (!ejecucion) {
      throw new NotFoundException('Ejecución no encontrada');
    }

    // Obtener camino visible
    const caminoVisible = await this.motor.obtenerCaminoVisible(id);

    return {
      ...ejecucion,
      caminoVisible,
    };
  }

  async aplicarRespuesta(
    ejecucionId: string,
    preguntaId: string,
    valor: any,
  ) {
    const ejecucion = await this.prisma.ejecucion.findUnique({
      where: { id: ejecucionId },
    });

    if (!ejecucion) {
      throw new NotFoundException('Ejecución no encontrada');
    }

    if (ejecucion.estado !== 'EN_PROGRESO') {
      throw new BadRequestException('La ejecución ya está finalizada o cancelada');
    }

    const resultado = await this.motor.aplicarRespuestaYRecalcular(
      ejecucionId,
      preguntaId,
      valor,
    );

    return resultado;
  }

  async deshacer(ejecucionId: string) {
    const ejecucion = await this.prisma.ejecucion.findUnique({
      where: { id: ejecucionId },
    });

    if (!ejecucion) {
      throw new NotFoundException('Ejecución no encontrada');
    }

    const deshecho = await this.motor.deshacerUltimoCambio(ejecucionId);

    if (!deshecho) {
      throw new BadRequestException('No hay cambios recientes para deshacer');
    }

    // Obtener nuevo estado
    const caminoVisible = await this.motor.obtenerCaminoVisible(ejecucionId);

    return {
      deshecho: true,
      caminoVisible,
    };
  }

  async finalizar(ejecucionId: string) {
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
      throw new NotFoundException('Ejecución no encontrada');
    }

    if (ejecucion.estado !== 'EN_PROGRESO') {
      throw new BadRequestException('La ejecución ya está finalizada o cancelada');
    }

    const config = ejecucion.plantillaVersion.configuracion as any;
    const caminoVisible = await this.motor.obtenerCaminoVisible(ejecucionId);

    // Validar preguntas requeridas en el camino visible
    const errores: string[] = [];
    const idsCaminoVisible = new Set(caminoVisible.map((p) => p.preguntaId));

    for (const pregunta of caminoVisible) {
      const validaciones = pregunta.validaciones || {};
      if (validaciones.requerido) {
        const respuesta = ejecucion.respuestas.find(
          (r) => r.preguntaId === pregunta.preguntaId,
        );

        if (!respuesta) {
          errores.push(`La pregunta "${pregunta.texto}" es requerida`);
        }
      }
    }

    if (errores.length > 0) {
      throw new BadRequestException({
        mensaje: 'Faltan respuestas requeridas',
        errores,
      });
    }

    // Calcular resultados
    const resultados = await this.motor.calcularResultados(ejecucionId);

    // Finalizar ejecución
    await this.prisma.ejecucion.update({
      where: { id: ejecucionId },
      data: {
        estado: 'FINALIZADA',
        finalizadaEn: new Date(),
      },
    });

    return {
      ejecucionId,
      resultados,
      finalizadaEn: new Date(),
    };
  }
}

