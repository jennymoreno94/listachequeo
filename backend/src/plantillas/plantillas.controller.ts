import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PlantillasService } from './plantillas.service';

@Controller('plantillas')
export class PlantillasController {
  constructor(private readonly plantillasService: PlantillasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  crear(@Body() data: { nombre: string; descripcion?: string }) {
    return this.plantillasService.crear(data);
  }

  @Get()
  listar() {
    return this.plantillasService.listar();
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.plantillasService.obtener(id);
  }

  @Put(':id/borrador')
  guardarBorrador(
    @Param('id') id: string,
    @Body() body: { configuracion: any },
  ) {
    return this.plantillasService.guardarBorrador(id, body.configuracion);
  }

  @Post(':id/validar')
  @HttpCode(HttpStatus.OK)
  validar(@Param('id') id: string, @Body() body: { configuracion: any }) {
    return this.plantillasService.validar(id, body.configuracion);
  }

  @Post(':id/publicar')
  @HttpCode(HttpStatus.CREATED)
  publicar(@Param('id') id: string, @Body() body: { configuracion: any }) {
    return this.plantillasService.publicar(id, body.configuracion);
  }

  @Get(':id/versiones')
  obtenerVersiones(@Param('id') id: string) {
    return this.plantillasService.obtenerVersiones(id);
  }

  @Get('version/:versionId')
  obtenerVersion(@Param('versionId') versionId: string) {
    return this.plantillasService.obtenerVersion(versionId);
  }
}

