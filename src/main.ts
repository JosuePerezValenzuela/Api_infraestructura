import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

  const prefix = cfg.get<string>('GLOBAL_PREFIX') ?? 'api';

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Infraestructura UMSS API')
    .setDescription(
      'API para gestionar toda la infraestructura de la Universidad mayor de San Simon',
    )
    .setVersion('1.0.0')
    .addServer(`/${prefix}`)
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const swaggerPath = `${prefix}/docs`;
  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(cfg.get<number>('PORT')!);
}
bootstrap();
