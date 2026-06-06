import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import serverlessExpress from '@vendia/serverless-express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

let cachedServer: any;

async function bootstrap() {
  if (cachedServer) return cachedServer;

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
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await nestApp.init();

  cachedServer = serverlessExpress({ app });
  return cachedServer;
}

if (!process.env.VERCEL) {
  bootstrap().then((handler) => {
    const port = process.env.PORT || 4000;
    express().use(handler).listen(port, () => new Logger('Bootstrap').log(`API running on port ${port}`));
  });
}

export const handler = async (event: any, context: any, callback: any) => {
  const server = await bootstrap();
  return server(event, context, callback);
};
