import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EjecucionesService } from './ejecuciones.service';

@Controller('ejecuciones')
export class EjecucionesController {
  constructor(private readonly ejecucionesService: EjecucionesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  crear(@Body() data: { plantillaId: string; plantillaVersionId: string }) {
    return this.ejecucionesService.crear(data);
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.ejecucionesService.obtener(id);
  }

  @Post(':id/respuestas')
  @HttpCode(HttpStatus.OK)
  aplicarRespuesta(
    @Param('id') ejecucionId: string,
    @Body() body: { preguntaId: string; valor: any },
  ) {
    return this.ejecucionesService.aplicarRespuesta(
      ejecucionId,
      body.preguntaId,
      body.valor,
    );
  }

  @Post(':id/deshacer')
  @HttpCode(HttpStatus.OK)
  deshacer(@Param('id') ejecucionId: string) {
    return this.ejecucionesService.deshacer(ejecucionId);
  }

  @Post(':id/finalizar')
  @HttpCode(HttpStatus.OK)
  finalizar(@Param('id') ejecucionId: string) {
    return this.ejecucionesService.finalizar(ejecucionId);
  }
}

