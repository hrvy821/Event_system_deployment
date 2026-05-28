import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus, Get, UseGuards, Req, Res, Patch, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, VerifyOtpDto, ResetPasswordDto } from './dto/forgot-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==========================================
  // EXISTING LOGIN ENDPOINT
  // ==========================================

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful, returns access token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    return this.authService.login(user);
  }

  @Get('google/status')
  @ApiOperation({ summary: 'Check whether Google OAuth is configured' })
  @ApiResponse({ status: 200, description: 'Google OAuth status' })
  googleStatus() {
    const enabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    return {
      enabled,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL ?? null,
    };
  }

  // ==========================================
  // EXISTING ENDPOINTS FOR FORGOT PASSWORD
  // ==========================================

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP for password reset' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify the OTP sent to email' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() body: VerifyOtpDto) {
    const result = await this.authService.verifyOtp(body.email, body.otp);
    return { message: result.message };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset the password using OTP' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.email, body.otp, body.newPassword);
  }

  // ==========================================
  // NEW ENDPOINTS FOR GOOGLE LOGIN
  // ==========================================

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth(@Req() req) {
    // This triggers the Passport Strategy. It redirects the user to Google's login page.
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback URL' })
  async googleAuthRedirect(@Req() req, @Res() res) {
    // Google sends the user back here with their profile info
    // The GoogleStrategy has already saved/found the user by this point
    
    // Generate your standard JWT token using the exact same method as normal login
    const tokenData = await this.authService.login(req.user);

    const configuredFrontendUrl = (process.env.FRONTEND_URL ?? '').replace(/\/$/, '');
    const inferredFrontendUrl = `${req.protocol}://${req.get('host')}`;
    const frontendUrl = configuredFrontendUrl || inferredFrontendUrl;

    // 🌟 FIX: Hardcode the frontend URL so it doesn't accidentally redirect to backend port 3000
    return res.redirect(
      `${frontendUrl}/login?token=${tokenData.access_token}&user=${encodeURIComponent(JSON.stringify(tokenData.user))}`
    );
  }

  // ==========================================
  // NEW ENDPOINTS FOR REACTIVATION
  // ==========================================

  @Post('reactivate/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to reactivate an archived account' })
  async sendReactivation(@Body() body: { email: string }) {
    return this.authService.sendReactivationOtp(body.email);
  }

  @Post('reactivate/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and log the user in' })
  async verifyReactivation(@Body() body: { email: string, otp: string }) {
    return this.authService.verifyReactivationOtp(body.email, body.otp);
  }

  // ==========================================
  // NEW ENDPOINTS FOR ADMIN USER MANAGEMENT
  // ==========================================

  @Patch('users/:id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a user and start 60-day deletion countdown' })
  async archiveUser(@Param('id') id: string) {
    return this.authService.archiveUser(+id);
  }
}
