import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { gmailTransport, shouldLogDevOtp } from '../common/mail-config';
import { queueMail } from '../common/mail-queue';

interface PendingUser {
  name: string;
  email: string;
  password?: string;
  role?: string;
  username?: string | null;
  avatarUrl?: string | null;
  eventReminders?: boolean;
  bookingUpdates?: boolean;
  marketingEmails?: boolean;
  darkMode?: boolean;
  otp: string;
  expiresAt: Date;
}

@Injectable()
export class UsersService {
  private pendingUsers = new Map<string, PendingUser>();

  private transporter = nodemailer.createTransport(gmailTransport('MAIL_PASS_USERS'));

  constructor(
    @InjectModel(User.name)
    private usersModel: Model<User>,
  ) {}

  private async nextId() {
    const last = await this.usersModel.findOne().sort({ id: -1 }).lean();
    return (last?.id ?? 0) + 1;
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private publicUserQuery() {
    return this.usersModel.find().select('-_id').lean();
  }

  async create(createUserDto: CreateUserDto) {
    const { password, email, ...rest } = createUserDto;
    const normalizedEmail = this.normalizeEmail(email);

    const existingUser = await this.findOneByEmail(normalizedEmail);
    if (existingUser) throw new BadRequestException('This email is already registered.');

    if (rest.username) {
      const existingUsername = await this.usersModel.findOne({ username: rest.username.trim() }).lean();
      if (existingUsername) throw new BadRequestException('This username is already taken.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    this.pendingUsers.set(normalizedEmail, {
      name: rest.name,
      username: rest.username?.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: rest.role,
      otp,
      expiresAt,
    } as PendingUser);

    if (shouldLogDevOtp()) {
      console.log(`\n=========================================`);
      console.log(`[DEV MODE] OTP CODE FOR ${normalizedEmail}: ${otp}`);
      console.log(`=========================================\n`);
    }

    await queueMail(
      this.transporter,
      {
        from: process.env.MAIL_FROM ?? process.env.MAIL_USER,
        to: normalizedEmail,
        subject: 'Verify your Account',
        text: `Welcome! Your verification code is: ${otp}. It will expire in 15 minutes.`,
      },
      `signup OTP -> ${normalizedEmail}`,
    );

    return { message: 'OTP sent. Please verify your email.' };
  }

  async createDirectly(createUserDto: CreateUserDto) {
    const { password, email, ...rest } = createUserDto;
    const normalizedEmail = this.normalizeEmail(email);

    const existingUser = await this.findOneByEmail(normalizedEmail);
    if (existingUser) throw new BadRequestException('This email is already registered.');

    if (rest.username) {
      const existingUsername = await this.usersModel.findOne({ username: rest.username.trim() }).lean();
      if (existingUsername) throw new BadRequestException('This username is already taken.');
    }

    const newUser = await this.usersModel.create({
      ...rest,
      id: await this.nextId(),
      email: normalizedEmail,
      username: rest.username?.trim() || null,
      password: await bcrypt.hash(password, 10),
      isActive: true,
    });

    return newUser.toObject();
  }

  async verifyEmailOtp(email: string, otp: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const pendingUser = this.pendingUsers.get(normalizedEmail);

    if (!pendingUser) throw new BadRequestException('No pending signup found. Please go back and sign up again.');
    if (pendingUser.otp !== otp) throw new BadRequestException('Invalid verification code');

    if (new Date() > pendingUser.expiresAt) {
      this.pendingUsers.delete(normalizedEmail);
      throw new BadRequestException('Verification code has expired. Please sign up again.');
    }

    if (pendingUser.username) {
      const existingUsername = await this.usersModel.findOne({ username: pendingUser.username.trim() }).lean();
      if (existingUsername) throw new BadRequestException('This username is already taken.');
    }

    await this.usersModel.create({
      id: await this.nextId(),
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      role: pendingUser.role,
      username: pendingUser.username?.trim() || null,
      avatarUrl: pendingUser.avatarUrl || null,
      eventReminders: pendingUser.eventReminders ?? true,
      bookingUpdates: pendingUser.bookingUpdates ?? true,
      marketingEmails: pendingUser.marketingEmails ?? false,
      darkMode: pendingUser.darkMode ?? false,
      isActive: true,
      resetOtp: null,
      resetOtpExpires: null,
      pendingEmail: null,
      pendingEmailOtp: null,
      pendingEmailOtpExpires: null,
    });

    this.pendingUsers.delete(normalizedEmail);
    return { message: 'Email verified successfully! You can now log in.' };
  }

  async activateGoogleUser(email: string, name: string, tempPassword: string) {
    return this.usersModel.create({
      id: await this.nextId(),
      name,
      email: this.normalizeEmail(email),
      password: await bcrypt.hash(tempPassword, 10),
      role: 'Attendee',
      isActive: true,
      eventReminders: true,
      bookingUpdates: true,
      marketingEmails: false,
      darkMode: false,
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersModel.findOne({ id }).select('-_id').lean();
    if (!user) throw new NotFoundException('User not found');
    return user as User;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersModel.findOne({ email: this.normalizeEmail(email) }).select('-_id').lean();
  }

  findAll() {
    return this.publicUserQuery();
  }

  async remove(id: number) {
    const user = await this.usersModel.findOne({ id });
    if (!user) return null;

    user.isActive = !user.isActive;
    return user.save();
  }

  async sendEmailChangeOtp(id: number, newEmail: string, currentPassword: string) {
    const user = await this.usersModel.findOne({ id });
    if (!user) throw new NotFoundException('User not found');
    if (!currentPassword?.trim()) throw new BadRequestException('Current password is required.');

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) throw new BadRequestException('Current password is incorrect.');

    const normalizedNewEmail = this.normalizeEmail(newEmail);
    if (normalizedNewEmail === user.email) throw new BadRequestException('New email must be different from current email.');

    const existingEmailOwner = await this.usersModel.findOne({ email: normalizedNewEmail, id: { $ne: id } }).lean();
    if (existingEmailOwner) throw new BadRequestException('This email is already registered.');

    const existingPendingOwner = await this.usersModel.findOne({ pendingEmail: normalizedNewEmail, id: { $ne: id } }).lean();
    if (existingPendingOwner) throw new BadRequestException('This email is already waiting for verification.');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    user.pendingEmail = normalizedNewEmail;
    user.pendingEmailOtp = otp;
    user.pendingEmailOtpExpires = expiresAt;
    await user.save();

    if (shouldLogDevOtp()) {
      console.log(`\n=========================================`);
      console.log(`[DEV MODE] OTP CODE FOR EMAIL CHANGE: ${otp}`);
      console.log(`=========================================\n`);
    }

    await queueMail(
      this.transporter,
      {
        from: process.env.MAIL_FROM ?? process.env.MAIL_USER,
        to: normalizedNewEmail,
        subject: 'Confirm your new email address',
        text: `Your Harmony Events email change verification code is: ${otp}. It will expire in 15 minutes.`,
      },
      `email change OTP -> ${normalizedNewEmail}`,
    );

    return { message: 'Verification code sent successfully to your new email address.' };
  }

  async verifyEmailChangeOtp(id: number, code: string) {
    const user = await this.usersModel.findOne({ id });
    if (!user) throw new NotFoundException('User not found');

    if (!user.pendingEmail || !user.pendingEmailOtp || !user.pendingEmailOtpExpires) {
      throw new BadRequestException('No pending email change found.');
    }

    if (user.pendingEmailOtp !== code) throw new BadRequestException('Invalid verification code.');

    if (new Date() > new Date(user.pendingEmailOtpExpires)) {
      user.pendingEmail = null;
      user.pendingEmailOtp = null;
      user.pendingEmailOtpExpires = null;
      await user.save();
      throw new BadRequestException('Verification code has expired.');
    }

    const oldEmail = user.email;
    const newEmail = String(user.pendingEmail);
    const emailOwner = await this.usersModel.findOne({ email: newEmail, id: { $ne: id } }).lean();
    if (emailOwner) throw new BadRequestException('This email is already registered.');

    user.email = newEmail;
    user.pendingEmail = null;
    user.pendingEmailOtp = null;
    user.pendingEmailOtpExpires = null;
    await user.save();

    await this.usersModel.db.collection('attendees').updateMany({ email: oldEmail }, { $set: { email: newEmail } });

    return this.findOne(id);
  }

  async update(
    id: number,
    updateData: UpdateUserDto & {
      currentPassword?: string;
      newPassword?: string;
      password?: string;
    },
  ) {
    const existingUser = await this.usersModel.findOne({ id });
    if (!existingUser) throw new NotFoundException('User not found');

    const sanitizedUpdate: any = {};

    if (typeof updateData.name !== 'undefined') sanitizedUpdate.name = updateData.name;

    if (typeof updateData.email !== 'undefined' && updateData.email.trim().toLowerCase() !== existingUser.email) {
      throw new BadRequestException('Use the email verification flow before changing your email.');
    }

    if (typeof updateData.username !== 'undefined') {
      const normalizedUsername = updateData.username?.trim() || null;
      if (normalizedUsername) {
        const usernameOwner = await this.usersModel.findOne({ username: normalizedUsername, id: { $ne: id } }).lean();
        if (usernameOwner) throw new BadRequestException('This username is already taken.');
      }
      sanitizedUpdate.username = normalizedUsername;
    }

    if (typeof updateData.avatarUrl !== 'undefined') sanitizedUpdate.avatarUrl = updateData.avatarUrl || null;
    if (typeof updateData.isActive !== 'undefined') sanitizedUpdate.isActive = updateData.isActive;
    if (typeof updateData.isArchived !== 'undefined') sanitizedUpdate.isArchived = updateData.isArchived;
    if (typeof updateData.archivedAt !== 'undefined') sanitizedUpdate.archivedAt = updateData.archivedAt;
    if (typeof updateData.resetOtp !== 'undefined') sanitizedUpdate.resetOtp = updateData.resetOtp;
    if (typeof updateData.resetOtpExpires !== 'undefined') sanitizedUpdate.resetOtpExpires = updateData.resetOtpExpires;
    if (typeof updateData.eventReminders !== 'undefined') sanitizedUpdate.eventReminders = updateData.eventReminders;
    if (typeof updateData.bookingUpdates !== 'undefined') sanitizedUpdate.bookingUpdates = updateData.bookingUpdates;
    if (typeof updateData.marketingEmails !== 'undefined') sanitizedUpdate.marketingEmails = updateData.marketingEmails;
    if (typeof updateData.darkMode !== 'undefined') sanitizedUpdate.darkMode = updateData.darkMode;

    if (typeof updateData.password !== 'undefined') {
      sanitizedUpdate.password = await bcrypt.hash(String(updateData.password), 10);
    }

    if (updateData.newPassword) {
      if (!updateData.currentPassword) throw new BadRequestException('Current password is required to change password.');

      const isPasswordValid = await bcrypt.compare(String(updateData.currentPassword), existingUser.password);
      if (!isPasswordValid) throw new BadRequestException('Current password is incorrect.');

      sanitizedUpdate.password = await bcrypt.hash(String(updateData.newPassword), 10);
    }

    await this.usersModel.updateOne({ id }, { $set: sanitizedUpdate });

    if (updateData.name) {
      await this.usersModel.db.collection('attendees').updateMany(
        { email: existingUser.email },
        { $set: { name: updateData.name } },
      );
    }

    return this.findOne(id);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleArchivedUsersCleanup() {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const result = await this.usersModel.deleteMany({
      isArchived: true,
      archivedAt: { $lt: sixtyDaysAgo },
    });

    if (result.deletedCount > 0) {
      console.log(`Permanently deleted ${result.deletedCount} expired accounts from the database.`);
    }
  }
}
