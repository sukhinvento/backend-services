import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department, DepartmentDocument } from './schemas/department.schema';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { AuditService } from '@audit/audit.service';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
    private readonly auditService: AuditService,
  ) {}

  // ── Create ─────────────────────────────────────────────────────────────────

  async create(
    dto: CreateDepartmentDto,
    userId: string,
    tenantId: string,
  ): Promise<Department> {
    const existing = await this.departmentModel.findOne({
      name: { $regex: new RegExp(`^${dto.name}$`, 'i') },
      tenantId,
    });
    if (existing) {
      throw new BadRequestException(
        `Department "${dto.name}" already exists for this tenant.`,
      );
    }

    const dept = new this.departmentModel({
      ...dto,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await dept.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'department',
      entityId: saved.id,
      newValue: saved.toObject(),
      tenantId,
    });

    return saved;
  }

  // ── List (paginated) ───────────────────────────────────────────────────────

  async findAll(
    tenantId: string,
    query: { page?: number; limit?: number; search?: string; status?: string },
  ) {
    const page  = Math.max(1, query.page  ?? 1);
    const limit = Math.min(25, query.limit ?? 25);
    const skip  = (page - 1) * limit;

    const filter: Record<string, any> = { tenantId };
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { name:        { $regex: query.search, $options: 'i' } },
        { code:        { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.departmentModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      this.departmentModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    };
  }

  // ── Active names list — for dropdowns ─────────────────────────────────────

  async findActiveNames(tenantId: string): Promise<string[]> {
    const depts = await this.departmentModel
      .find({ tenantId, status: 'active' })
      .select('name')
      .sort({ name: 1 })
      .lean();
    return depts.map((d) => d.name);
  }

  // ── Single ─────────────────────────────────────────────────────────────────

  async findOne(id: string, tenantId: string): Promise<Department> {
    const dept = await this.departmentModel.findOne({ _id: id, tenantId });
    if (!dept) throw new NotFoundException(`Department ${id} not found.`);
    return dept;
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateDepartmentDto,
    userId: string,
    tenantId: string,
  ): Promise<Department> {
    const dept = await this.departmentModel.findOne({ _id: id, tenantId });
    if (!dept) throw new NotFoundException(`Department ${id} not found.`);

    // Prevent duplicate name (case-insensitive), excluding self
    if (dto.name && dto.name.toLowerCase() !== dept.name.toLowerCase()) {
      const conflict = await this.departmentModel.findOne({
        name: { $regex: new RegExp(`^${dto.name}$`, 'i') },
        tenantId,
        _id: { $ne: id },
      });
      if (conflict) {
        throw new BadRequestException(`Department "${dto.name}" already exists.`);
      }
    }

    const oldValue = dept.toObject();
    Object.assign(dept, { ...dto, updatedBy: userId });
    const saved = await dept.save();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'department',
      entityId: id,
      oldValue,
      newValue: saved.toObject(),
      tenantId,
    });

    return saved;
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async remove(id: string, userId: string, tenantId: string): Promise<void> {
    const dept = await this.departmentModel.findOne({ _id: id, tenantId });
    if (!dept) throw new NotFoundException(`Department ${id} not found.`);

    const oldValue = dept.toObject();
    await this.departmentModel.deleteOne({ _id: id, tenantId });

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'department',
      entityId: id,
      oldValue,
      tenantId,
    });
  }

  // ── Validate that a department name exists (for referential integrity) ─────

  async validateDepartmentName(
    name: string,
    tenantId: string,
  ): Promise<boolean> {
    // If no departments are configured yet for this tenant, skip validation
    const count = await this.departmentModel.countDocuments({ tenantId });
    if (count === 0) return true;

    const exists = await this.departmentModel.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      tenantId,
      status: 'active',
    });
    return !!exists;
  }
}
