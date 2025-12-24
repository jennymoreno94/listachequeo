import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { PlantillasModule } from './plantillas/plantillas.module';
import { EjecucionesModule } from './ejecuciones/ejecuciones.module';
import { ValidacionModule } from './validacion/validacion.module';
import { MotorModule } from './motor/motor.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ValidacionModule,
    MotorModule,
    PlantillasModule,
    EjecucionesModule,
  ],
})
export class AppModule {}

