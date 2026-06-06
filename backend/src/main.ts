import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

const server = express();

async function bootstrap() {
  const app = express();
  const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(app), { rawBody: true });

  nestApp.use(compression());
  nestApp.use(cookieParser());
  nestApp.enableCors({ origin: '*', credentials: true });
  nestApp.useGlobalFilters(new AllExceptionsFilter());
  nestApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true }),
  );

  await nestApp.init();
  return app;
}

if (!process.env.VERCEL) {
  bootstrap().then((app) => {
    const port = process.env.PORT || 4000;
    app.listen(port, () => new Logger('Bootstrap').log(`API running on port ${port}`));
  });
}

export async function handler(req: any, res: any) {
  const app = await bootstrap();
  app(req, res);
}
