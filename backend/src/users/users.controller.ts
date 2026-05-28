import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user and send verification email' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user email using OTP' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  verifyEmail(@Body() body: { email: string; code: string }) {
    return this.usersService.verifyEmailOtp(body.email, body.code);
  }

  @Post('admin')
  @ApiOperation({ summary: 'Admin direct user creation (No OTP)' })
  @ApiResponse({ status: 201, description: 'User created and saved to DB instantly' })
  createDirectly(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createDirectly(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one user by ID' })
  @ApiResponse({ status: 200, description: 'User found successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Post(':id/email-change/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP for changing existing user email' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  sendEmailChangeOtp(
    @Param('id') id: string,
    @Body() body: { newEmail: string; currentPassword: string },
  ) {
    return this.usersService.sendEmailChangeOtp(+id, body.newEmail, body.currentPassword);
  }

  @Post(':id/email-change/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and apply email change' })
  @ApiResponse({ status: 200, description: 'Email changed successfully' })
  verifyEmailChangeOtp(
    @Param('id') id: string,
    @Body() body: { code: string },
  ) {
    return this.usersService.verifyEmailChangeOtp(+id, body.code);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by ID (Partial Update)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  updatePartial(@Param('id') id: string, @Body() updateData: any) { // 🌟 FIX: 'any' prevents passwords/avatars from being stripped!
    return this.usersService.update(+id, updateData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user by ID (Full Update)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  updateFull(@Param('id') id: string, @Body() updateData: any) { // 🌟 FIX: 'any' prevents passwords/avatars from being stripped!
    return this.usersService.update(+id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}