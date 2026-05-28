import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  isArchived?: boolean;
  archivedAt?: Date | null;
  resetOtp?: string | null;
  resetOtpExpires?: Date | null;

  // username is automatically inherited from CreateUserDto!
  avatarUrl?: string | null;

  currentPassword?: string;
  newPassword?: string;

  // Preferences
  eventReminders?: boolean;
  bookingUpdates?: boolean;
  marketingEmails?: boolean;
  darkMode?: boolean;
}