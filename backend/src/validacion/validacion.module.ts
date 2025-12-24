import { Module } from '@nestjs/common';
import { ValidadorPlantillaService } from './validador-plantilla.service';

@Module({
  providers: [ValidadorPlantillaService],
  exports: [ValidadorPlantillaService],
})
export class ValidacionModule {}

