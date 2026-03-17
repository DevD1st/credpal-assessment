import { HttpAdapterHost, NestFactory, Reflector } from "@nestjs/core";
import { ClassSerializerInterceptor, ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import {
  LoggingService,
  RequestIdMiddleware,
} from "@credpal-fx-trading-app/runtime";
import { GlobalExceptionsFilter } from "@credpal-fx-trading-app/runtime";
import { getDefaultLoggerOpts } from "@credpal-fx-trading-app/common";
import { getConfig } from "./utils/index.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get<LoggingService>(LoggingService);
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
  app.useGlobalFilters(new GlobalExceptionsFilter(httpAdapter));

  const config = new DocumentBuilder()
    .setTitle("CredPal API Gateway")
    .setDescription("API Gateway for CredPal fintech platform")
    .setVersion("1.0")
    .addBearerAuth(undefined, "Bearer")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, "0.0.0.0");

  logger.log(`🚀 Gateway running on http://localhost:${port}!!`);
  logger.log(`📚 API Docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
