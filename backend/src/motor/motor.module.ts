import { Module } from '@nestjs/common';
import { MotorDecisionesService } from './motor-decisiones.service';

@Module({
  providers: [MotorDecisionesService],
  exports: [MotorDecisionesService],
})
export class MotorModule {}

