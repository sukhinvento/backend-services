import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationPreferenceService } from './notification-preference.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { NOTIFICATION_CATEGORIES } from './schemas/notification-preference.schema';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prefService: NotificationPreferenceService,
  ) {}

  // ─── Notification list ────────────────────────────────────────────────────

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
      req.user.userId,
      req.user.tenantId,
      {
        limit: limit ? parseInt(limit, 10) : 25,
        offset: offset ? parseInt(offset, 10) : 0,
        unreadOnly: unreadOnly === 'true',
      },
    );
  }

  @ApiOperation({ summary: 'Get unread notification count' })
  @Get('unread-count')
  async getUnreadCount(@Req() req: RequestWithUser) {
    const count = await this.notificationsService.getUnreadCount(
      req.user.userId,
      req.user.tenantId,
    );
    return { unreadCount: count };
  }

  @ApiOperation({ summary: 'Mark a notification as read' })
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.notificationsService.markAsRead(id, req.user.userId, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @Post('mark-all-read')
  markAllAsRead(@Req() req: RequestWithUser) {
    return this.notificationsService.markAllAsRead(req.user.userId, req.user.tenantId);
  }

  // ─── Notification preferences ────────────────────────────────────────────

  @ApiOperation({ summary: 'Get notification preferences for current user' })
  @ApiResponse({ status: 200, description: 'User notification channel preferences per category' })
  @Get('preferences')
  getPreferences(@Req() req: RequestWithUser) {
    return this.prefService.getPreferences(req.user.userId, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Update notification preferences (full replace)' })
  @Put('preferences')
  updateAllPreferences(
    @Req() req: RequestWithUser,
    @Body() body: any,
  ) {
    return this.prefService.updateAll(req.user.userId, req.user.tenantId, body.channels);
  }

  @ApiOperation({ summary: 'Update a single category preference' })
  @Patch('preferences/:category')
  updateCategoryPreference(
    @Req() req: RequestWithUser,
    @Param('category') category: string,
    @Body() body: { email?: boolean; sms?: boolean; whatsapp?: boolean },
  ) {
    if (!NOTIFICATION_CATEGORIES.includes(category as any)) {
      return { error: `Unknown category: ${category}` };
    }
    return this.prefService.updateCategory(req.user.userId, req.user.tenantId, category as any, body);
  }
}
