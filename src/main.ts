import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const cfg = app.get(ConfigService);
  //Seguridad HTTP
  app.use(helmet());
  app.enableCors({ origin: true, credentials: true });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
