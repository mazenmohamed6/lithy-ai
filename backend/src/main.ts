import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExpressAdapter } from '@nestjs/platform-express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import serverless from 'serverless-http';
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
  return server;
}

let handler: ReturnType<typeof serverless>;

export async function handlerFn(event: any, context: any) {
  if (!handler) {
    const serverApp = await bootstrap();
    handler = serverless(serverApp);
  }
  return handler(event, context);
}

const port = process.env.PORT || 4000;
if (!process.env.VERCEL) {
  bootstrap().then((server) => {
    server.listen(port, () => new Logger('Bootstrap').log(`API running on port ${port}`));
  });
}
