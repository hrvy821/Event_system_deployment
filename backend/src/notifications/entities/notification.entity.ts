import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({
  collection: 'notifications',
  timestamps: { createdAt: true, updatedAt: false },
  id: false,
  versionKey: false,
})
export class Notification {
  @Prop({ type: Number, unique: true, index: true })
  id: number;

  @Prop({ required: true })
  userId: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: 'SYSTEM' })
  type: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Date })
  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
