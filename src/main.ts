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

  //Prefijo global del .env
  app.setGlobalPrefix(cfg.get<string>('GLOBAL_PREFIX')!);

  //Validacion global (DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(cfg.get<number>('PORT')!);
}
bootstrap();
