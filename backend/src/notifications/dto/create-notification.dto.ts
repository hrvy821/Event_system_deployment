import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ description: 'The ID of the user receiving the notification', example: 1 })
  userId: number;

  @ApiProperty({ description: 'Title of the notification', example: 'Event Approved!' })
  title: string;

  @ApiProperty({ description: 'Main message content', example: 'Your event Tech Summit has been approved.' })
  message: string;

  @ApiPropertyOptional({ description: 'Type of notification', example: 'APPROVAL' })
  type?: string;
}