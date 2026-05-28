import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationsModel: Model<Notification>,
  ) {}

  private async nextId() {
    const last = await this.notificationsModel.findOne().sort({ id: -1 }).lean();
    return (last?.id ?? 0) + 1;
  }

  async createNotification(userId: number, title: string, message: string, type: string) {
    return this.notificationsModel.create({
      id: await this.nextId(),
      userId,
      title,
      message,
      type,
    });
  }

  async getUserNotifications(userId: number) {
    return this.notificationsModel.find({ userId }).sort({ createdAt: -1 }).select('-_id').lean();
  }

  async markAsRead(id: number) {
    return this.notificationsModel.findOneAndUpdate({ id }, { isRead: true }, { new: true }).select('-_id').lean();
  }

  async broadcastToAttendees(title: string, message: string, type: string) {
    const mongoose = this.notificationsModel.db;
    const attendees = await mongoose.collection('users').find({ role: 'Attendee' }).project({ id: 1 }).toArray();

    if (!attendees || attendees.length === 0) {
      return { message: 'No attendees found to notify.' };
    }

    const startingId = await this.nextId();
    const notificationsToInsert = attendees.map((attendee, index) => ({
      id: startingId + index,
      userId: attendee.id,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date(),
    }));

    await this.notificationsModel.insertMany(notificationsToInsert);

    return { message: `Successfully broadcasted to ${attendees.length} attendees!` };
  }
}
