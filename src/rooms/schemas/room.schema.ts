import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type RoomDocument = Room & Document;

@Schema({ timestamps: true })
export class Room extends BaseSchema {
  @Prop({ required: true })
  room_number: string; // unique per tenant

  @Prop()
  floor: number;

  @Prop({
    required: true,
    type: String,
    enum: ['general', 'semi_private', 'private', 'icu', 'deluxe', 'suite'],
  })
  type: string;

  @Prop({
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'reserved'],
    default: 'available',
  })
  status: string;

  @Prop({ default: 1 })
  bed_capacity: number;

  @Prop({ default: 0 })
  occupied_beds: number;

  @Prop({ required: true })
  daily_rate: number;

  @Prop([String])
  amenities: string[];

  @Prop()
  department: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;
}

export const RoomSchema = SchemaFactory.createForClass(Room);

RoomSchema.index({ tenantId: 1, room_number: 1 }, { unique: true });
RoomSchema.index({ tenantId: 1, status: 1 });
RoomSchema.index({ tenantId: 1, type: 1 });
RoomSchema.index({ tenantId: 1, department: 1 });
RoomSchema.index({ tenantId: 1, floor: 1 });
