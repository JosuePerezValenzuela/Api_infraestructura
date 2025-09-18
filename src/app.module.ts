import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './config/validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      //Valida el esquam del joi
      validationSchema: envSchema,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
