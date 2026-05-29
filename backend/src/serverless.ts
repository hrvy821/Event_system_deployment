import * as dotenv from 'dotenv';
import express, { json, urlencoded } from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

dotenv.config({ quiet: true });

let cachedServer: ReturnType<typeof express> | null = null;

async function createServer() {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    bodyParser: false,
  });

  app.enableCors({ origin: true, credentials: true });
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  const config = new DocumentBuilder()
    .setTitle('Event Management API')
    .setDescription('API for managing events, attendees, users, and authentication')
    .setVersion('1.0')
    .addTag('events', 'Event management endpoints')
    .addTag('attendees', 'Attendee management endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('auth', 'Authentication endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.init();
  return expressApp;
}

export default async function handler(req: any, res: any) {
  cachedServer ??= await createServer();
  return cachedServer(req, res);
}
