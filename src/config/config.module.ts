import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath: `infra/environments/.env.${process.env.NODE_ENV || 'development'}`,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        JWT_SECRET: Joi.string().required(),
        MONGO_URI: Joi.string().required(),
        ENCRYPTION_KEY: Joi.string().length(64).required(),
        ENCRYPTION_HMAC_KEY: Joi.string().length(64).required(),
      }),
    }),
  ],
})
export class ConfigModule {}
