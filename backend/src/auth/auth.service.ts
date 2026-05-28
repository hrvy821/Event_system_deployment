import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER ?? 'harmony.events9@gmail.com',
      pass: process.env.MAIL_PASS_AUTH ?? 'daui vsir avzl bgbw',
    },
  });

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email.trim().toLowerCase());

    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: any) {
    if (!user.isActive || user.isArchived) {
      await this.usersService.update(user.id, {
        isActive: true,
        isArchived: false,
        archivedAt: null,
      } as any);

      user.isActive = true;
      user.isArchived = false;
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    const freshUser = await this.usersService.findOne(user.id);

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: freshUser.id,
        name: freshUser.name,
        role: freshUser.role,
        email: freshUser.email,
        username: freshUser.username,
        avatarUrl: freshUser.avatarUrl,
        createdAt: freshUser.createdAt,
        updatedAt: freshUser.updatedAt,
        isActive: freshUser.isActive,
        isArchived: freshUser.isArchived,
        preferences: {
          eventReminders: freshUser.eventReminders,
          bookingUpdates: freshUser.bookingUpdates,
          marketingEmails: freshUser.marketingEmails,
          darkMode: freshUser.darkMode,
        },
      },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOneByEmail(email.trim().toLowerCase());
    if (!user) throw new NotFoundException('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await this.usersService.update(
      user.id,
      {
        resetOtp: otp,
        resetOtpExpires: expiresAt,
      } as any,
    );

    const mailOptions = {
      from: 'harmony.events9@gmail.com',
      to: user.email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}. It will expire in 15 minutes.`,
    };

    await this.transporter.sendMail(mailOptions);
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.usersService.findOneByEmail(email.trim().toLowerCase());
    if (!user) throw new NotFoundException('User not found');

    if (user.resetOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (!user.resetOtpExpires || new Date() > new Date(user.resetOtpExpires)) {
      throw new BadRequestException('OTP has expired or is invalid');
    }

    return { message: 'OTP verified successfully', user };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const { user } = await this.verifyOtp(email, otp);

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await this.usersService.update(
      user.id,
      {
        password: hashedPassword,
        resetOtp: null,
        resetOtpExpires: null,
      } as any,
    );

    return { message: 'Password reset successfully' };
  }

  async sendReactivationOtp(email: string) {
    const user = await this.usersService.findOneByEmail(email.trim().toLowerCase());
    if (!user) throw new NotFoundException('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await this.usersService.update(
      user.id,
      { resetOtp: otp, resetOtpExpires: expiresAt } as any,
    );

    const mailOptions = {
      from: 'harmony.events9@gmail.com',
      to: user.email,
      subject: 'Reactivate your Account',
      text: `Your account was archived. Your OTP to reactivate and verify your email is: ${otp}. It will expire in 15 minutes.`,
    };

    await this.transporter.sendMail(mailOptions);
    return { message: 'Reactivation OTP sent successfully' };
  }

  async verifyReactivationOtp(email: string, otp: string) {
    const { user } = await this.verifyOtp(email, otp);

    await this.usersService.update(
      user.id,
      {
        isActive: true,
        isArchived: false,
        archivedAt: null,
        resetOtp: null,
        resetOtpExpires: null,
      } as any,
    );

    return this.login(user);
  }

  async archiveUser(id: number) {
    await this.usersService.update(
      id,
      {
        isActive: false,
        isArchived: true,
        archivedAt: new Date(),
      } as any,
    );

    return {
      message: 'User archived successfully. 60-day deletion countdown started.',
    };
  }
}
