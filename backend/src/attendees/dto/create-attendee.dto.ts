import { ApiProperty } from '@nestjs/swagger';

export class CreateAttendeeDto {
  @ApiProperty({ description: 'Attendee name', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'Attendee email', example: 'john@example.com' })
  email: string;

  @ApiProperty({ description: 'Attendee company', example: 'Tech Corp' })
  company: string;

  @ApiProperty({ description: 'Event ID', example: '1' })
  eventId: string;

  amountPaid?: string;
}