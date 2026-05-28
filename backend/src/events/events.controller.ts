import { Controller, Get, Post, Body, Param, Delete, Put, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiResponse({ status: 200, description: 'List of events' })
  findAll() {
    return this.eventsService.findAll();
  }

  @Get('summary/stats')
  @ApiOperation({ summary: 'Get event statistics' })
  @ApiResponse({ status: 200, description: 'Event statistics' })
  async getStats() {
    const allEvents = await this.eventsService.findAll();
    const totalEvents = allEvents.length;
    const totalRevenue = allEvents.reduce((sum, event) => {
      const price = parseFloat(event.price) || 0;
      return sum + price;
    }, 0);

    return {
      totalEvents,
      totalRevenue,
      totalAttendees: 0,
    };
  }

  @Get('organizer/:organizerId')
  @ApiOperation({ summary: 'Get events by organizer ID' })
  @ApiParam({ name: 'organizerId', description: 'Organizer ID' })
  @ApiResponse({ status: 200, description: 'List of events for the organizer' })
  findByOrganizer(@Param('organizerId') organizerId: string) {
    return this.eventsService.findByOrganizer(+organizerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event details' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(+id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event archived successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  remove(@Param('id') id: string) {
    return this.eventsService.remove(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(+id, updateEventDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  updatePartial(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(+id, updateEventDto);
  }
}
