import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService implements OnModuleInit {
  constructor(
    @InjectModel(Event.name)
    private eventsModel: Model<Event>,
  ) {}

  private async nextId() {
    const last = await this.eventsModel.findOne().sort({ id: -1 }).lean();
    return (last?.id ?? 0) + 1;
  }

  async create(createEventDto: CreateEventDto) {
    return this.eventsModel.create({ ...createEventDto, id: await this.nextId() });
  }

  async findAll() {
    return this.eventsModel
      .aggregate([
        {
          $lookup: {
            from: 'attendees',
            let: { eventId: { $toString: '$id' } },
            pipeline: [{ $match: { $expr: { $eq: ['$eventId', '$$eventId'] } } }],
            as: 'attendees',
          },
        },
        { $addFields: { ticketsSold: { $size: '$attendees' } } },
        { $project: { attendees: 0, _id: 0 } },
        { $sort: { id: 1 } },
      ])
      .exec();
  }

  async findByOrganizer(organizerId: number) {
    return this.eventsModel
      .aggregate([
        { $match: { organizerId } },
        {
          $lookup: {
            from: 'attendees',
            let: { eventId: { $toString: '$id' } },
            pipeline: [{ $match: { $expr: { $eq: ['$eventId', '$$eventId'] } } }],
            as: 'attendees',
          },
        },
        { $addFields: { ticketsSold: { $size: '$attendees' } } },
        { $project: { attendees: 0, _id: 0 } },
        { $sort: { id: 1 } },
      ])
      .exec();
  }

  findOne(id: number) {
    return this.eventsModel.findOne({ id }).select('-_id').lean();
  }

  async remove(id: number) {
    const event = await this.eventsModel.findOne({ id });
    if (!event) return null;

    event.isArchived = !event.isArchived;
    return event.save();
  }

  async update(id: number, updateEventDto: UpdateEventDto) {
    return this.eventsModel
      .findOneAndUpdate({ id }, updateEventDto, { new: true })
      .select('-_id')
      .lean();
  }

  async updateStatus(id: number, status: string) {
    const event = await this.eventsModel
      .findOneAndUpdate({ id }, { status }, { new: true })
      .select('-_id')
      .lean();

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async onModuleInit() {
    await this.autoCompleteExpiredEvents();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async autoCompleteExpiredEvents() {
    const todayString = new Date().toISOString().split('T')[0];
    const result = await this.eventsModel.updateMany(
      { status: 'Published', date: { $lt: todayString } },
      { $set: { status: 'Completed' } },
    );

    if (result.modifiedCount > 0) {
      console.log(`Automatically moved ${result.modifiedCount} events to Completed status.`);
    }
  }
}
