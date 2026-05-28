import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users', timestamps: true, id: false, versionKey: false })
export class User {
  @Prop({ type: Number, unique: true, index: true })
  id!: number;

  @Prop({ required: true, unique: true, index: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ default: 'Attendee' })
  role!: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: String, default: null })
  resetOtp!: string | null;

  @Prop({ type: Date, default: null })
  resetOtpExpires!: Date | null;

  @Prop({ default: false })
  isArchived!: boolean;

  @Prop({ type: Date, default: null })
  archivedAt!: Date | null;

  @Prop({ type: Date })
  createdAt!: Date;

  @Prop({ type: Date })
  updatedAt!: Date;

  @Prop({
    type: String,
    default: null,
    unique: true,
    partialFilterExpression: { username: { $type: 'string' } },
  })
  username!: string | null;

  @Prop({ type: String, default: null })
  avatarUrl!: string | null;

  @Prop({ default: true })
  eventReminders!: boolean;

  @Prop({ default: true })
  bookingUpdates!: boolean;

  @Prop({ default: false })
  marketingEmails!: boolean;

  @Prop({ default: false })
  darkMode!: boolean;

  @Prop({
    type: String,
    default: null,
    unique: true,
    partialFilterExpression: { pendingEmail: { $type: 'string' } },
  })
  pendingEmail!: string | null;

  @Prop({ type: String, default: null })
  pendingEmailOtp!: string | null;

  @Prop({ type: Date, default: null })
  pendingEmailOtpExpires!: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
