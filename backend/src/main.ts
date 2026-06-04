import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

const app = express();
let initialized = false;

async function init() {
  if (initialized) return;
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
  initialized = true;
}

const ready = init().catch((err) => {
  console.error('=== SERVERLESS INIT FAILED ===', err?.stack || err);
});

if (process.argv[1] && !process.env.VERCEL) {
  ready.then(() => {
    const port = process.env.PORT || 4000;
    app.listen(port, () => new Logger('Serverless').log(`Listening on port ${port}`));
  });
}

export default async function handler(req: any, res: any) {
  try {
    await ready;
    app(req, res);
  } catch {
    res.statusCode = 503;
    res.end('Service unavailable');
  }
}
