import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationError } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const cfg = app.get(ConfigService);
  const port = cfg.get<number>('PORT') ?? 3000;
  const corsOrigins = cfg
    .get<string>('CORS_ORIGINS')
    ?.split(',')
    .map((o) => o.trim())
    .filter(Boolean) ?? ['http://localhost:8000', 'http://localhost:3001'];
  const prefix = cfg.get<string>('GLOBAL_PREFIX') ?? 'api';
  const baseUrl = cfg.get<string>('API_BASE_URL') ?? `http://localhost:${port}`;
  //Seguridad HTTP
  app.use(helmet());

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'], // <- nombre correcto
    credentials: true,
  });

  //Prefijo global del .env
  app.setGlobalPrefix(prefix);

  //Validacion global (DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      exceptionFactory: (errors: ValidationError[] = []) => {
        // orden de prioridad de mensajes
        const prio = [
          'isDefined',
          'isNotEmpty',
          'isString',
          'isNumber',
          'isInt',
          'isBoolean',
          'maxLength',
          'minLength',
        ];

        const details = errors.flatMap(collect);
        return new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son válidos',
          details,
        });

        function collect(
          err: ValidationError,
        ): { field: string; message: string }[] {
          const out: { field: string; message: string }[] = [];
          const stack: ValidationError[] = [err];
          while (stack.length) {
            const e = stack.pop()!;
            if (e.constraints) {
              const keys = Object.keys(e.constraints);
              const best =
                keys.sort(
                  (a, b) =>
                    (prio.indexOf(a) === -1 ? 999 : prio.indexOf(a)) -
                    (prio.indexOf(b) === -1 ? 999 : prio.indexOf(b)),
                )[0] ?? keys[0];
              out.push({ field: e.property, message: e.constraints[best] });
            }
            if (e.children?.length) stack.push(...e.children);
          }
          return out;
        }
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Infraestructura UMSS API')
    .setDescription(
      'API para gestionar toda la infraestructura de la Universidad mayor de San Simon',
    )
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const swaggerPath = `${prefix}/docs`;
  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  await app.listen(port);
  console.log(`Documentacion en: ${baseUrl}${port}/${swaggerPath}`);
  console.log(`Api en: ${baseUrl}${port}/${prefix}`);
}
bootstrap();
