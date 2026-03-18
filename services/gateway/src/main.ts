import { HttpAdapterHost, NestFactory, Reflector } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { ClassSerializerInterceptor, ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import {
  LoggingService,
  RequestIdMiddleware,
  LOGGING_SERVICE_TOKEN,
} from "@credpal-fx-trading-app/runtime";
import { GlobalExceptionsFilter } from "@credpal-fx-trading-app/runtime";
import { getConfig } from "./utils/index.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get<LoggingService>(LOGGING_SERVICE_TOKEN);
  app.useLogger(logger);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.enableVersioning();

  app.use(RequestIdMiddleware);
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalExceptionsFilter(httpAdapter, logger));

  const config = new DocumentBuilder()
    .setTitle("CredPal API Gateway")
    .setDescription("API Gateway for CredPal fintech platform")
    .setVersion("1.0")
    .addBearerAuth(undefined, "Bearer")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const rabbitEnv = getConfig("rabbitmq");
  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.RMQ,
      options: {
        urls: [rabbitEnv.url],
        queue: rabbitEnv.queue,
        exchange: rabbitEnv.exchange,
        exchangeType: "topic",
        prefetchCount: 1,
        persistent: true,
        wildcards: true,
        noAck: false,
        queueOptions: {
          durable: true,
        },
      } as any,
    },
    { inheritAppConfig: true },
  );

  await app.startAllMicroservices();

  const port = process.env.PORT || 3000;
  await app.listen(port, "0.0.0.0");

  logger.log(`🚀 Gateway running on http://localhost:${port}!!`);
  logger.log(`📚 API Docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
