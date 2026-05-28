import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendeesService } from './attendees.service';
import { AttendeesController } from './attendees.controller';
import { Attendee, AttendeeSchema } from './entities/attendee.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: Attendee.name, schema: AttendeeSchema }])],
  controllers: [AttendeesController],
  providers: [AttendeesService],
})
export class AttendeesModule {}
