import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ValidadorPlantillaService } from '../validacion/validador-plantilla.service';
import * as crypto from 'crypto';

@Injectable()
export class PlantillasService {
  constructor(
    private prisma: PrismaService,
    private validador: ValidadorPlantillaService,
  ) {}

  async crear(data: { nombre: string; descripcion?: string }) {
    return this.prisma.plantilla.create({
      data,
    });
  }

  async listar() {
    return this.prisma.plantilla.findMany({
      include: {
        versiones: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async obtener(id: string) {
    const plantilla = await this.prisma.plantilla.findUnique({
      where: { id },
      include: {
        borradores: {
          orderBy: { actualizadaEn: 'desc' },
          take: 1,
        },
        versiones: {
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!plantilla) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    return plantilla;
  }

  async guardarBorrador(plantillaId: string, configuracion: any) {
    const plantilla = await this.prisma.plantilla.findUnique({
      where: { id: plantillaId },
    });

    if (!plantilla) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    // Validar estructura básica
    const validacion = this.validador.validarEstructura(configuracion);
    if (!validacion.valido) {
      throw new BadRequestException({
        mensaje: 'Configuración inválida',
        errores: validacion.errores,
      });
    }

    // Buscar borrador existente o crear uno nuevo
    const borradorExistente = await this.prisma.plantillaBorrador.findFirst({
      where: { plantillaId },
    });

    if (borradorExistente) {
      return this.prisma.plantillaBorrador.update({
        where: { id: borradorExistente.id },
        data: {
          configuracion: configuracion as any,
        },
      });
    } else {
      return this.prisma.plantillaBorrador.create({
        data: {
          plantillaId,
          configuracion: configuracion as any,
        },
      });
    }
  }

  async validar(plantillaId: string, configuracion: any) {
    const validacion = this.validador.validarCompleta(configuracion);

    return {
      valido: validacion.valido,
      errores: validacion.errores,
      warnings: validacion.warnings,
    };
  }

  async publicar(plantillaId: string, configuracion: any) {
    const plantilla = await this.prisma.plantilla.findUnique({
      where: { id: plantillaId },
      include: {
        versiones: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!plantilla) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    // Validar completamente
    const validacion = this.validador.validarCompleta(configuracion);
    if (!validacion.valido) {
      throw new BadRequestException({
        mensaje: 'No se puede publicar: la configuración tiene errores',
        errores: validacion.errores,
        warnings: validacion.warnings,
      });
    }

    // Calcular checksum
    const configString = JSON.stringify(configuracion);
    const checksum = crypto.createHash('sha256').update(configString).digest('hex');

    // Obtener siguiente versión
    const ultimaVersion = plantilla.versiones[0]?.version || 0;
    const nuevaVersion = ultimaVersion + 1;

    // Crear versión inmutable
    const version = await this.prisma.plantillaVersion.create({
      data: {
        plantillaId,
        version: nuevaVersion,
        configuracion: configuracion as any,
        checksum,
      },
    });

    // Actualizar estado de plantilla
    await this.prisma.plantilla.update({
      where: { id: plantillaId },
      data: { estado: 'PUBLICADA' },
    });

    return version;
  }

  async obtenerVersiones(plantillaId: string) {
    return this.prisma.plantillaVersion.findMany({
      where: { plantillaId },
      orderBy: { version: 'desc' },
    });
  }

  async obtenerVersion(versionId: string) {
    const version = await this.prisma.plantillaVersion.findUnique({
      where: { id: versionId },
      include: {
        plantilla: true,
      },
    });

    if (!version) {
      throw new NotFoundException('Versión no encontrada');
    }

    return version;
  }
}

