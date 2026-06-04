import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

export async function createApp() {
  const server = express();

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), { rawBody: true });

  app.use(compression());
  app.use(cookieParser());
  app.enableCors({ origin: '*', credentials: true });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();

  return server;
}
