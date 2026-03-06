import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { envSchema } from './config/validation';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampusModule } from './modules/campus/campus.module';
import { FacultadModule } from './modules/facultad/facultad.module';
import { TipoBloqueModule } from './modules/tipo-bloque/tipo-bloque.module';
import { BloqueModule } from './modules/bloque/bloque.module';
import { TipoAmbienteModule } from './modules/tipo-ambiente/tipo-ambiente.module';
import { AmbienteModule } from './modules/ambiente/ambiente.module';
import { ActivoModule } from './modules/activo/activo.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { DashboardCampusModule } from './modules/dashboard-campus/dashboard-campus.module';
import { DashboardFacultadModule } from './modules/dashboard-facultad/dashboard-facultad.module';
import { DashboardBloqueModule } from './modules/dashboard-bloque/dashboard-bloque.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      //Valida el esquam del joi
      validationSchema: envSchema,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get<string>('DB_HOST'),
        port: cfg.get<number>('DB_PORT'),
        database: cfg.get<string>('DB_NAME'),
        username: cfg.get<string>('DB_USER'),
        password: cfg.get<string>('DB_PASSWORD'),
        autoLoadEntities: true,
        synchronize: false,
        logging: true,
        extra: { application_name: 'Infra_nest' },
      }),
    }),
    CampusModule,
    FacultadModule,
    TipoBloqueModule,
    TipoAmbienteModule,
    BloqueModule,
    AmbienteModule,
    ActivoModule,
    ReportesModule,
    DashboardCampusModule,
    DashboardFacultadModule,
    DashboardBloqueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
