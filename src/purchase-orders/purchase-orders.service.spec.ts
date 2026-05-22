import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrder } from './schemas/purchase-order.schema';
import { TenantsService } from '@tenants/tenants.service';
import { AuditService } from '@audit/audit.service';
import { QueryBuilderService } from '@common/services/query-builder.service';

const TENANT_ID = 'tenant-abc';
const USER_ID = 'user-123';

const mockItems = [
  { item_id: '507f1f77bcf86cd799439011', name: 'Paracetamol 500mg', qty: 10, unit_price: 5, discount: 0, subtotal: 50, tax_slab: 5, sale_unit: 'Strip' },
  { item_id: '507f1f77bcf86cd799439012', name: 'Amoxicillin 250mg', qty: 5, unit_price: 80, discount: 0, subtotal: 400, tax_slab: 12, sale_unit: 'Box' },
];

const mockCreateDto = {
  vendor_id: '507f1f77bcf86cd799439020',
  vendor_name: 'PharmaCorp India Pvt Ltd',
  vendor_phone: '+91-9876543210',
  vendor_email: 'vendor@pharmcorp.com',
  vendor_address: '123 Pharma Street, Mumbai',
  order_date: '2024-01-15',
  delivery_date: '2024-01-30',
  items: mockItems,
  grand_total: 550,
  payment_method: 'net-30',
  notes: 'Test PO',
};

const savedPo: any = {
  _id: '507f1f77bcf86cd799439099',
  id: '507f1f77bcf86cd799439099',
  po_number: 'PO-TENANT-001',
  ...mockCreateDto,
  tenantId: TENANT_ID,
  status: 'draft',
  createdBy: USER_ID,
  updatedBy: USER_ID,
  toObject() { return { ...this }; },
};

const MockModel: any = jest.fn().mockImplementation(() => ({
  save: jest.fn().mockResolvedValue(savedPo),
}));
MockModel.find = jest.fn();
MockModel.findOne = jest.fn();
MockModel.findOneAndUpdate = jest.fn();
MockModel.findOneAndDelete = jest.fn();

const mockTenantsService = { getFieldConfiguration: jest.fn().mockResolvedValue([]) };
const mockAuditService = { log: jest.fn().mockResolvedValue(undefined) };
const mockQueryBuilder = {
  buildQuery: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([savedPo]) }),
};

describe('PurchaseOrdersService', () => {
  let service: PurchaseOrdersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    MockModel.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrdersService,
        { provide: getModelToken(PurchaseOrder.name), useValue: MockModel },
        { provide: TenantsService, useValue: mockTenantsService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: QueryBuilderService, useValue: mockQueryBuilder },
      ],
    }).compile();

    service = module.get<PurchaseOrdersService>(PurchaseOrdersService);
  });

  describe('create', () => {
    it('persists items array as-is from DTO', async () => {
      MockModel.mockImplementationOnce(() => ({ save: jest.fn().mockResolvedValue(savedPo) }));

      await service.create(mockCreateDto as any, USER_ID, TENANT_ID);

      expect(MockModel.mock.calls[0][0].items).toEqual(mockItems);
      expect(MockModel.mock.calls[0][0].items).toHaveLength(2);
    });

    it('persists grand_total from DTO', async () => {
      MockModel.mockImplementationOnce(() => ({ save: jest.fn().mockResolvedValue(savedPo) }));

      await service.create(mockCreateDto as any, USER_ID, TENANT_ID);

      expect(MockModel.mock.calls[0][0].grand_total).toBe(550);
    });

    it('persists vendor_id and vendor_name from DTO', async () => {
      MockModel.mockImplementationOnce(() => ({ save: jest.fn().mockResolvedValue(savedPo) }));

      await service.create(mockCreateDto as any, USER_ID, TENANT_ID);

      const arg = MockModel.mock.calls[0][0];
      expect(arg.vendor_id).toBe('507f1f77bcf86cd799439020');
      expect(arg.vendor_name).toBe('PharmaCorp India Pvt Ltd');
    });

    it('auto-generates po_number when not provided', async () => {
      MockModel.mockImplementationOnce(() => ({ save: jest.fn().mockResolvedValue(savedPo) }));
      const dto = { ...mockCreateDto } as any;
      delete dto.po_number;

      await service.create(dto, USER_ID, TENANT_ID);

      expect(MockModel.mock.calls[0][0].po_number).toMatch(/^PO-/);
    });

    it('uses provided po_number when given', async () => {
      MockModel.mockImplementationOnce(() => ({ save: jest.fn().mockResolvedValue(savedPo) }));

      await service.create({ ...mockCreateDto, po_number: 'PO-CUSTOM-001' } as any, USER_ID, TENANT_ID);

      expect(MockModel.mock.calls[0][0].po_number).toBe('PO-CUSTOM-001');
    });

    it('always sets status to draft regardless of DTO value', async () => {
      MockModel.mockImplementationOnce(() => ({ save: jest.fn().mockResolvedValue(savedPo) }));

      await service.create({ ...mockCreateDto, status: 'approved' } as any, USER_ID, TENANT_ID);

      expect(MockModel.mock.calls[0][0].status).toBe('draft');
    });

    it('throws BadRequestException when required custom field is missing', async () => {
      mockTenantsService.getFieldConfiguration.mockResolvedValueOnce([
        { field_id: 'department', label: 'Department', required: true },
      ]);

      await expect(service.create(mockCreateDto as any, USER_ID, TENANT_ID)).rejects.toThrow(BadRequestException);
    });

    it('logs audit on create', async () => {
      MockModel.mockImplementationOnce(() => ({ save: jest.fn().mockResolvedValue(savedPo) }));

      await service.create(mockCreateDto as any, USER_ID, TENANT_ID);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'create', entity: 'purchase_order', userId: USER_ID }),
      );
    });
  });

  describe('findAll', () => {
    it('scopes query to tenantId', async () => {
      await service.findAll({}, TENANT_ID);

      expect(mockQueryBuilder.buildQuery.mock.calls[0][1].filter.tenantId).toBe(TENANT_ID);
    });
  });

  describe('findOne', () => {
    it('queries by _id and tenantId', async () => {
      MockModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(savedPo) });

      await service.findOne('507f1f77bcf86cd799439099', TENANT_ID);

      expect(MockModel.findOne).toHaveBeenCalledWith({ _id: '507f1f77bcf86cd799439099', tenantId: TENANT_ID });
    });
  });

  describe('update', () => {
    it('updates items and grand_total', async () => {
      const updated = { ...savedPo, items: [mockItems[0]], grand_total: 50 };
      MockModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(savedPo) });
      MockModel.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(updated) });

      const result = await service.update(
        '507f1f77bcf86cd799439099',
        { items: [mockItems[0]], grand_total: 50 } as any,
        USER_ID, TENANT_ID,
      );

      expect(MockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439099', tenantId: TENANT_ID },
        expect.objectContaining({ items: [mockItems[0]], grand_total: 50 }),
        { new: true },
      );
      expect(result).toEqual(updated);
    });

    it('logs audit on update', async () => {
      MockModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(savedPo) });
      MockModel.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(savedPo) });

      await service.update('507f1f77bcf86cd799439099', {} as any, USER_ID, TENANT_ID);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'update', entity: 'purchase_order' }),
      );
    });
  });

  describe('getStats', () => {
    it('returns correct counts and values', async () => {
      const orders = [
        { status: 'draft', grand_total: 100 },
        { status: 'approved', grand_total: 200 },
        { status: 'fulfilled', grand_total: 300 },
        { status: 'cancelled', grand_total: 400 },
      ];
      MockModel.find.mockReturnValue({ lean: () => ({ exec: () => Promise.resolve(orders) }) });

      const stats = await service.getStats(TENANT_ID);

      expect(stats.totalOrders).toBe(4);
      expect(stats.pendingOrders).toBe(1);   // draft
      expect(stats.approvedOrders).toBe(1);
      expect(stats.deliveredOrders).toBe(1); // fulfilled
      expect(stats.totalValue).toBe(1000);
      expect(stats.pendingValue).toBe(100);
    });

    it('returns zero stats when no orders exist', async () => {
      MockModel.find.mockReturnValue({ lean: () => ({ exec: () => Promise.resolve([]) }) });

      const stats = await service.getStats(TENANT_ID);

      expect(stats.totalOrders).toBe(0);
      expect(stats.totalValue).toBe(0);
      expect(stats.averageOrderValue).toBe(0);
    });
  });

  describe('remove', () => {
    it('deletes by _id and tenantId and returns id', async () => {
      MockModel.findOneAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue(savedPo) });

      const result = await service.remove('507f1f77bcf86cd799439099', USER_ID, TENANT_ID);

      expect(MockModel.findOneAndDelete).toHaveBeenCalledWith({ _id: '507f1f77bcf86cd799439099', tenantId: TENANT_ID });
      expect(result).toEqual({ id: '507f1f77bcf86cd799439099' });
    });
  });
});
