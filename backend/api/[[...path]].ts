import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

let cachedServer: any;

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const { AppModule } = require('../dist/src/app.module');
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.use(compression());
  app.use(cookieParser());

  const frontendUrl = configService.get<string>('FRONTEND_URL');
  app.enableCors({
    origin: frontendUrl || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();
  cachedServer = app.getHttpAdapter().getInstance();
  logger.log('NestJS ready');
}

export default async (req: any, res: any) => {
  if (!cachedServer) {
    await bootstrap();
  }
  cachedServer(req, res);
};
