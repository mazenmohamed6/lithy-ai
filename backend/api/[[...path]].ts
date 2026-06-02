import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

let cachedServer: any;

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  let AppModule: any;
  try {
    AppModule = require('../dist/src/app.module').AppModule;
  } catch (e: any) {
    logger.error(`Failed to load AppModule: ${e.message}`);
    throw e;
  }
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
  try {
    if (!cachedServer) {
      await bootstrap();
    }
    cachedServer(req, res);
  } catch (e: any) {
    const logger = new Logger('Handler');
    logger.error(`Handler error: ${e.message}`);
    res.status(500).json({
      statusCode: 500,
      message: e.message || 'Internal server error',
      error: 'Internal Server Error',
    });
  }
};
