import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AttendeeDocument = HydratedDocument<Attendee>;

@Schema({ collection: 'attendees', timestamps: true, id: false, versionKey: false })
export class Attendee {
  @Prop({ type: Number, unique: true, index: true })
  id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ type: String, default: null })
  company: string;

  @Prop({ required: true })
  eventId: string;

  @Prop({ default: 'Pending' })
  status: string;

  @Prop({ required: true })
  ticketId: string;

  @Prop({ default: '0' })
  amountPaid: string;

  @Prop({ type: Date, default: null })
  checkedInAt: Date | null;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const AttendeeSchema = SchemaFactory.createForClass(Attendee);
