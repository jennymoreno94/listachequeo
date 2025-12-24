import { Module } from '@nestjs/common';
import { EjecucionesController } from './ejecuciones.controller';
import { EjecucionesService } from './ejecuciones.service';
import { MotorModule } from '../motor/motor.module';

@Module({
  imports: [MotorModule],
  controllers: [EjecucionesController],
  providers: [EjecucionesService],
  exports: [EjecucionesService],
})
export class EjecucionesModule {}

