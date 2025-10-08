import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { envSchema } from './config/validation';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampusModule } from './modules/campus/campus.module';
import { FacultadModule } from './modules/facultad/facultad.module';

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
        schema: 'infraestructura',
        logging: true,
        extra: { application_name: 'Infra_nest' },
      }),
    }),
    CampusModule,
    FacultadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
