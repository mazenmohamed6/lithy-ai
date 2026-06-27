import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

let cachedApp: any;

export async function bootstrap() {
  const server = express();
  server.use(express.json({ limit: '20mb', verify: (req: any, _res, buf) => { req.rawBody = buf; } }));
  server.use(express.urlencoded({ limit: '20mb', extended: true, verify: (req: any, _res, buf) => { req.rawBody = buf; } }));

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  app.use(compression());
  app.use(cookieParser());
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, origin?: string | boolean) => void) => callback(null, origin || true),
    credentials: true,
  });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (process.env.VERCEL) {
    await app.init();
    return app.getHttpAdapter().getInstance();
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);
  new Logger('Bootstrap').log(`API running on port ${port}`);
}

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    cachedApp = await bootstrap();
  }
  cachedApp(req, res);
}

if (!process.env.VERCEL) {
  bootstrap();
}
