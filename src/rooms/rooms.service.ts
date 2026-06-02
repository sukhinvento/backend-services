import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { AuditService } from '@audit/audit.service';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    private readonly auditService: AuditService,
  ) {}

  async create(createRoomDto: CreateRoomDto, userId: string, tenantId: string, username?: string) {
    const newRoom = new this.roomModel({
      ...createRoomDto,
      tenantId,
      createdBy: username || userId,
      updatedBy: username || userId,
    });
    const saved = await newRoom.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'room',
      entityId: saved.id as string,
      newValue: saved.toObject(),
      tenantId,
    });

    return saved;
  }

  async findAll(
    tenantId: string,
    status?: string,
    type?: string,
    department?: string,
    floor?: number,
  ) {
    const filter: Record<string, any> = { tenantId };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (department) filter.department = department;
    if (floor !== undefined) filter.floor = floor;

    return this.roomModel.find(filter).sort({ room_number: 1 }).exec();
  }

  async findAvailable(tenantId: string) {
    return this.roomModel.find({ tenantId, status: 'available' }).exec();
  }

  async getStats(tenantId: string) {
    const [byStatus, byType] = await Promise.all([
      this.roomModel.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.roomModel.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);
    return { byStatus, byType };
  }

  async findOne(id: string, tenantId: string) {
    const room = await this.roomModel.findOne({ _id: id, tenantId }).exec();
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async update(id: string, updateRoomDto: UpdateRoomDto, userId: string, tenantId: string, username?: string) {
    const old = await this.roomModel.findOne({ _id: id, tenantId }).exec();
    if (!old) throw new NotFoundException('Room not found');

    const updated = await this.roomModel
      .findByIdAndUpdate(id, { ...updateRoomDto, updatedBy: username || userId }, { new: true })
      .exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'room',
      entityId: id,
      oldValue: old.toObject(),
      newValue: updated?.toObject(),
      tenantId,
    });

    return updated;
  }

  async remove(id: string, userId: string, tenantId: string) {
    const removed = await this.roomModel.findOneAndDelete({ _id: id, tenantId }).exec();
    if (!removed) throw new NotFoundException('Room not found');

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'room',
      entityId: id,
      oldValue: removed.toObject(),
      tenantId,
    });

    return { id };
  }
}
