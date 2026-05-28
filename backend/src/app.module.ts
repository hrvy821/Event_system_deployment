import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule'; 
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { EventsModule } from './events/events.module';
import { AttendeesModule } from './attendees/attendees.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module'; 

dotenv.config({ quiet: true });

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'dist'),
      exclude: ['/api*', '/auth*', '/events*', '/attendees*', '/users*', '/notifications*'],
    }),
    ScheduleModule.forRoot(), 
    MongooseModule.forRoot(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/event_db', {
      dbName: process.env.MONGODB_DB ?? 'event_db',
    }),
    EventsModule,
    AttendeesModule,
    UsersModule,
    AuthModule,
    NotificationsModule, 
  ],
})
export class AppModule {}
