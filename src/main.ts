import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Enable validation (lenient mode to not break existing endpoints)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties without decorators (but custom_fields handled separately)
      forbidNonWhitelisted: false, // Allow extra properties
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
        exposeDefaultValues: true,
      },
      skipMissingProperties: false, // Validate required fields
      skipNullProperties: false, // Let @IsOptional() handle null
      skipUndefinedProperties: false, // Let @IsOptional() handle undefined
      validateCustomDecorators: true,
    }),
  );

  // Enable CORS for cross-origin requests
  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : false)
      : true, // Allow all origins in development
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'Origin',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Methods',
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page',
      'X-Per-Page',
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Vendor Service API')
    .setDescription(
      `
      API documentation for the Vendor Service - managing tenants, vendors, orders, and invoices.
      
      ## Authentication
      Most endpoints require JWT authentication. Use the login endpoint to get a token.
      
      ## How to use authentication:
      1. Call POST /auth/login with your credentials
      2. Copy the access_token from the response
      3. Click the "Authorize" button (lock icon) at the top of this page
      4. Enter "Bearer <your_access_token>" in the authorization field
      5. Click "Authorize" and then "Close"
      6. All subsequent API calls will include the authorization header
      
      ## Schemas
      All request/response schemas are documented below. Check the 'Schemas' section for detailed field information.
    `,
    )
    .setVersion('1.0')
    .addTag('app', 'Application health and status endpoints')
    .addTag('auth', 'Authentication and authorization endpoints')
    .addTag('tenants', 'Tenant management endpoints')
    .addTag('vendors', 'Vendor management endpoints')
    .addTag('taxes', 'Tax configuration and management endpoints')
    .addTag('purchase-orders', 'Purchase order management endpoints')
    .addTag('sales-orders', 'Sales order management endpoints')
    .addTag('invoices', 'Invoice management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description:
          'Enter JWT token (the token will be automatically prefixed with "Bearer ")',
        in: 'header',
      },
      'JWT-auth',
    )
    .addSecurityRequirements('JWT-auth')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
}
void bootstrap();
