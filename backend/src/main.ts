import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

const server = express();

async function bootstrap() {
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
}

const ready = bootstrap().catch((err) => {
  new Logger('Bootstrap').error('App initialization failed', err);
});

if (!process.env.VERCEL) {
  (async () => {
    await ready;
    const port = process.env.PORT || 4000;
    server.listen(port, () => new Logger('Bootstrap').log(`API running on port ${port}`));
  })();
}

export default async function handler(req: any, res: any) {
  try {
    await ready;
    server(req, res);
  } catch {
    res.statusCode = 503;
    res.end('Service unavailable');
  }
}
