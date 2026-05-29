import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendee } from './entities/attendee.entity';
import { CreateAttendeeDto } from './dto/create-attendee.dto';
import * as nodemailer from 'nodemailer';
import * as QRCode from 'qrcode';
import { queueMail } from '../common/mail-queue';

@Injectable()
export class AttendeesService {
  private transporter;

  constructor(
    @InjectModel(Attendee.name)
    private attendeeModel: Model<Attendee>,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      pool: true,
      maxConnections: 1,
      maxMessages: 25,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 30000,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS_ATTENDEES,
      },
    });
  }

  private async nextId() {
    const last = await this.attendeeModel.findOne().sort({ id: -1 }).lean();
    return (last?.id ?? 0) + 1;
  }

  async generateQrCodeBuffer(ticketId: string) {
    return QRCode.toBuffer(ticketId.trim(), {
      type: 'png',
      width: 250,
      margin: 2,
      errorCorrectionLevel: 'M',
    });
  }

  private generateQrCodeHtml(ticketId: string) {
    const qr = QRCode.create(ticketId.trim(), {
      errorCorrectionLevel: 'M',
    }) as any;
    const size = qr.modules.size;
    const data = qr.modules.data as boolean[];
    const cellSize = 5;
    const quietCells = 4;
    const fullSize = size + quietCells * 2;
    const tableSize = fullSize * cellSize;
    const rows: string[] = [];

    for (let row = -quietCells; row < size + quietCells; row += 1) {
      const cells: string[] = [];

      for (let col = -quietCells; col < size + quietCells; col += 1) {
        const isDark = row >= 0 && row < size && col >= 0 && col < size ? data[row * size + col] : false;
        cells.push(
          `<td style="width:${cellSize}px;height:${cellSize}px;line-height:${cellSize}px;font-size:0;background:${isDark ? '#000000' : '#ffffff'};padding:0;margin:0;border:0;"></td>`,
        );
      }

      rows.push(`<tr style="height:${cellSize}px;padding:0;margin:0;border:0;">${cells.join('')}</tr>`);
    }

    return `
      <table role="presentation" aria-label="Ticket QR Code" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-spacing:0;width:${tableSize}px;height:${tableSize}px;background:#ffffff;margin:0 auto;">
        ${rows.join('')}
      </table>
    `;
  }

  async create(createAttendeeDto: CreateAttendeeDto) {
    const existingTicket = await this.attendeeModel.findOne({
      email: createAttendeeDto.email,
      eventId: createAttendeeDto.eventId,
    });

    if (existingTicket && existingTicket.status !== 'Cancelled') {
      throw new BadRequestException('You are already registered for this event!');
    }

    const randomId = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `TIX-${randomId}`;

    const savedAttendee = await this.attendeeModel.create({
      ...createAttendeeDto,
      id: await this.nextId(),
      ticketId,
      status: 'Pending',
    });

    try {
      const qrCodeHtml = this.generateQrCodeHtml(ticketId);

      queueMail(
        this.transporter,
        {
          from: process.env.MAIL_FROM ?? process.env.MAIL_USER,
          to: savedAttendee.email,
          subject: `Your Ticket Confirmed: ${ticketId}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">You're Going!</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Registration Confirmed</p>
              </div>
              <div style="padding: 30px; text-align: center; background-color: #ffffff;">
                <p style="font-size: 16px; color: #4b5563; margin-bottom: 5px;">Hi <strong>${savedAttendee.name}</strong>,</p>
                <p style="font-size: 16px; color: #4b5563; margin-bottom: 20px;">Here is your official e-ticket. Present this QR code at the entrance.</p>
                <div style="background-color: #f3f4f6; padding: 18px; border-radius: 12px; display: inline-block;">
                  ${qrCodeHtml}
                  <p style="margin: 15px 0 0 0; font-family: monospace; font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #111827;">${ticketId}</p>
                </div>
              </div>
            </div>
          `,
        },
        `ticket email -> ${savedAttendee.email}`,
      );
    } catch (error) {
      console.error('Failed to send ticket email:', error);
    }

    return savedAttendee;
  }

  findAll() {
    return this.attendeeModel.find().select('-_id').lean();
  }

  async checkRegistration(email: string, eventId: string) {
    const existingAttendee = await this.attendeeModel.findOne({ email, eventId }).lean();
    const isActuallyGoing = existingAttendee ? existingAttendee.status !== 'Cancelled' : false;

    return {
      isRegistered: isActuallyGoing,
      status: existingAttendee?.status || null,
    };
  }

  async scanTicket(rawTicketId: string) {
    const ticketId = rawTicketId.trim();
    const attendee = await this.attendeeModel.findOne({ ticketId });

    if (!attendee) throw new NotFoundException('Ticket not found in the database.');
    if (attendee.status === 'Checked In') throw new BadRequestException('This ticket has already been scanned!');
    if (attendee.status === 'Cancelled') throw new BadRequestException('This ticket was cancelled.');

    attendee.status = 'Checked In';
    attendee.checkedInAt = new Date();

    return attendee.save();
  }

  async updateStatus(ticketId: string, status: string) {
    const attendee = await this.attendeeModel.findOne({ ticketId });

    if (!attendee) {
      throw new NotFoundException(`Attendee with Ticket ID ${ticketId} not found`);
    }

    attendee.status = status;
    attendee.checkedInAt = status === 'Checked In' ? new Date() : null;

    return attendee.save();
  }

  async remove(id: number) {
    const attendee = await this.attendeeModel.findOne({ id });
    if (!attendee) return null;

    attendee.status = 'Cancelled';
    attendee.checkedInAt = null;
    return attendee.save();
  }
}
