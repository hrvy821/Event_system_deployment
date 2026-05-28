import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventDocument = HydratedDocument<Event>;

@Schema({ collection: 'events', timestamps: true, id: false, versionKey: false })
export class Event {
  @Prop({ type: Number, unique: true, index: true })
  id: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  time: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  category: string;

  @Prop({ type: String, default: null })
  description: string;

  @Prop({ required: true })
  price: string;

  @Prop({ type: String, default: null })
  announcement: string;

  @Prop({ required: true })
  organizerId: number;

  @Prop({ default: false })
  isArchived: boolean;

  @Prop({ type: String, default: null })
  imageUrl: string;

  @Prop({ type: String, default: null })
  bannerUrl: string;

  @Prop({ type: Number, default: 0 })
  capacity: number;

  @Prop({ default: 'Pending' })
  status: string;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
