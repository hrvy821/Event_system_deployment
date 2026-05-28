import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, IsBoolean, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'User password', example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' }) // 🌟 Aligned with frontend rules
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/, {
    message: 'Password must contain 1 uppercase letter, 1 number, and 1 special character',
  })
  password!: string;

  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  // 🌟 NEW: Added the missing username property!
  @ApiProperty({ description: 'Unique username', example: 'johndoe123', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username?: string;

  @ApiProperty({ description: 'User role', example: 'Attendee', enum: ['Admin', 'Organizer', 'Attendee'] })
  @IsString()
  @IsNotEmpty()
  role!: string;

  @ApiProperty({ description: 'Whether the user is active', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}