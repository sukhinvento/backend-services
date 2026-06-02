import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'Get notifications for current user' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  @Get()
  findAll(
    @Req() req: RequestWithUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.findAll(
      req.user.username,
      req.user.tenantId,
      {
        limit: limit ? parseInt(limit, 10) : 25,
        offset: offset ? parseInt(offset, 10) : 0,
        unreadOnly: unreadOnly === 'true',
      },
    );
  }

  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  @Get('unread-count')
  async getUnreadCount(@Req() req: RequestWithUser) {
    const count = await this.notificationsService.getUnreadCount(
      req.user.username,
      req.user.tenantId,
    );
    return { unreadCount: count };
  }

  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.notificationsService.markAsRead(
      id,
      req.user.username,
      req.user.tenantId,
    );
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
  })
  @Post('mark-all-read')
  markAllAsRead(@Req() req: RequestWithUser) {
    return this.notificationsService.markAllAsRead(
      req.user.username,
      req.user.tenantId,
    );
  }
}
