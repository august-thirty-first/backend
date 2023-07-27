import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: ['http://10.19.233.2:3000', 'http://10.19.233.2:4000'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    },
  });
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT);
}
bootstrap();
