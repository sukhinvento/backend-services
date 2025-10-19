import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get welcome message',
    description: 'Returns a welcome message for authenticated users',
  })
  @ApiResponse({ status: 200, description: 'Success', type: String })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Health and readiness endpoints should be publicly accessible for monitoring
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns application health status',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    type: String,
  })
  @Get('health')
  getHealth(): string {
    return 'OK';
  }

  @ApiOperation({
    summary: 'Readiness check',
    description: 'Returns application readiness status',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is ready',
    type: String,
  })
  @Get('ready')
  getReady(): string {
    return 'OK';
  }
}
