import { Controller, Get, Param, Patch, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('user/:userId')
  getUserNotifications(@Param('userId') userId: string) {
    return this.notificationsService.getUserNotifications(+userId);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(+id);
  }

  // An endpoint for the Admin to trigger a notification to an Organizer
  @Post()
  create(@Body() body: { userId: number, title: string, message: string, type: string }) {
    return this.notificationsService.createNotification(body.userId, body.title, body.message, body.type);
  }

  // 🌟 NEW: The super-fast broadcast endpoint
  @Post('broadcast/attendees')
  broadcastToAttendees(@Body() body: { title: string, message: string, type?: string }) {
    return this.notificationsService.broadcastToAttendees(body.title, body.message, body.type || 'INFO');
  }
}