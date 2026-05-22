import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SalesOrdersService } from './sales-orders.service';
import { SalesOrder } from './schemas/sales-order.schema';
import { AuditService } from '@audit/audit.service';
import { QueryBuilderService } from '@common/services/query-builder.service';

const TENANT_ID = 'tenant-abc';
const USER_ID = 'user-123';

const mockItems = [
  { item_id: '507f1f77bcf86cd799439011', name: 'Amoxicillin 250mg', qty: 2, unit_price: 80, discount: 5, subtotal: 152, tax_slab: 12, sale_unit: 'Box' },
  { item_id: '507f1f77bcf86cd799439012', name: 'Paracetamol 500mg', qty: 10, unit_price: 5, discount: 0, subtotal: 50, tax_slab: 5, sale_unit: 'Strip' },
];

const mockCreateDto = {
  customer_id: '507f1f77bcf86cd799439030',
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  customer_phone: '+91-9876543210',
  customer_address: '456 Customer Lane, Delhi',
  order_date: '2024-01-15',
  delivery_date: '2024-01-20',
  items: mockItems,
  grand_total: 1200,
  payment_method: 'Credit Card',
  payment_status: 'Pending',
  notes: 'Test SO',
};

const savedSo: any = {
  _id: '507f1f77bcf86cd799439098',
  id: '507f1f77bcf86cd799439098',
  so_number: 'SO-TENANT-001',
  ...mockCreateDto,
  tenantId: TENANT_ID,
  status: 'draft',
  createdBy: USER_ID,
  updatedBy: USER_ID,
  toObject() { return { ...this }; },
};

const MockModel: any = jest.fn().mockImplementation(() => ({
  save: jest.fn().mockResolvedValue(savedSo),
}));
MockModel.find = jest.fn();
MockModel.findById = jest.fn();
MockModel.findByIdAndUpdate = jest.fn();
MockModel.findByIdAndDelete = jest.fn();

const mockAuditService = { log: jest.fn().mockResolvedValue(undefined) };
const mockQueryBuilder = {
  buildQuery: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([savedSo]) }),
};

describe('SalesOrdersService', () => {
  let service: SalesOrdersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    MockModel.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesOrdersService,
        { provide: getModelToken(SalesOrder.name), useValue: MockModel },
        { provide: AuditService, useValue: mockAuditService },
        { provide: QueryBuilderService, useValue: mockQueryBuilder },
      ],
    }).compile();

    service = module.get<SalesOrdersService>(SalesOrdersService);
  });

  describe('create', () => {
    it('persists items array from DTO', async () => {
      MockModel.mockImplementationOnce(() => ({ save: jest.fn().mockResolvedValue(savedSo) }));

      await service.create(mockCreateDto as any, USER_ID, TENANT_ID);

      expect(MockModel.mock.calls[0][0].items).toEqual(mockItems);
      expect(MockModel.mock.calls[0][0].items).toHaveLength(2);
    });

    it('persists grand_total from DTO', async () => {
      MockModel.mockImplementationOnce(() => ({ save: jest.fn().mockResolvedValue(savedSo) }));

      await service.create(mockCreateDto as any, USER_ID, TENANT_ID);

      expect(MockModel.mock.calls[0][0].grand_total).toBe(1200);
    });

    it('persists customer_id and customer_name from DTO', async () => {
      MockModel.mockImplementationOnce(() => ({ save: jest.fn().mockResolvedValue(savedSo) }));

      await service.create(mockCreateDto as any, USER_ID, TENANT_ID);

      const arg = MockModel.mock.calls[0][0];
      expect(arg.customer_id).toBe('507f1f77bcf86cd799439030');
      expect(arg.customer_name).toBe('John Doe');
    });

    it('auto-generates so_number when not provided', async () => {
      MockModel.mockImplementationOnce(() => ({ save: jest.fn().mockResolvedValue(savedSo) }));
      const dto = { ...mockCreateDto } as any;
      delete dto.so_number;

      await service.create(dto, USER_ID, TENANT_ID);

      expect(MockModel.mock.calls[0][0].so_number).toMatch(/^SO-/);
    });

    it('uses provided so_number when given', async () => {
      MockModel.mockImplementationOnce(() => ({ save: jest.fn().mockResolvedValue(savedSo) }));

      await service.create({ ...mockCreateDto, so_number: 'SO-CUSTOM-001' } as any, USER_ID, TENANT_ID);

      expect(MockModel.mock.calls[0][0].so_number).toBe('SO-CUSTOM-001');
    });

    it('defaults status to draft when not provided', async () => {
      MockModel.mockImplementationOnce(() => ({ save: jest.fn().mockResolvedValue(savedSo) }));
      const dto = { ...mockCreateDto } as any;
      delete dto.status;

      await service.create(dto, USER_ID, TENANT_ID);

      expect(MockModel.mock.calls[0][0].status).toBe('draft');
    });

    it('logs audit on create', async () => {
      MockModel.mockImplementationOnce(() => ({ save: jest.fn().mockResolvedValue(savedSo) }));

      await service.create(mockCreateDto as any, USER_ID, TENANT_ID);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'create', entity: 'sales_order', userId: USER_ID }),
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
    it('queries by id using findById', async () => {
      MockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(savedSo) });

      const result = await service.findOne('507f1f77bcf86cd799439098');

      expect(MockModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439098');
      expect(result).toEqual(savedSo);
    });
  });

  describe('update', () => {
    it('updates items and grand_total', async () => {
      const updated = { ...savedSo, items: [mockItems[0]], grand_total: 152 };
      MockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(savedSo) });
      MockModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(updated) });

      const result = await service.update(
        '507f1f77bcf86cd799439098',
        { items: [mockItems[0]], grand_total: 152 } as any,
        USER_ID, TENANT_ID,
      );

      expect(MockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439098',
        expect.objectContaining({ items: [mockItems[0]], grand_total: 152 }),
        { new: true },
      );
      expect(result).toEqual(updated);
    });

    it('logs audit on update', async () => {
      MockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(savedSo) });
      MockModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(savedSo) });

      await service.update('507f1f77bcf86cd799439098', {} as any, USER_ID, TENANT_ID);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'update', entity: 'sales_order' }),
      );
    });
  });

  describe('getStats', () => {
    it('returns correct counts and revenue', async () => {
      const orders = [
        { status: 'draft', grand_total: 500, payment_status: 'Pending' },
        { status: 'Processing', grand_total: 300, payment_status: 'Paid' },
        { status: 'Delivered', grand_total: 200, payment_status: 'Pending' },
        { status: 'Invoiced', grand_total: 400, payment_status: 'Paid' },
      ];
      MockModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue(orders) });

      const stats = await service.getStats(TENANT_ID);

      expect(stats.totalOrders).toBe(4);
      expect(stats.totalRevenue).toBe(1400);
      expect(stats.processingOrders).toBe(2);  // draft + Processing
      expect(stats.deliveredOrders).toBe(2);   // Delivered + Invoiced
      expect(stats.pendingPayments).toBe(700); // orders where payment_status === 'Pending'
    });

    it('returns zero stats for empty tenant', async () => {
      MockModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });

      const stats = await service.getStats(TENANT_ID);

      expect(stats.totalOrders).toBe(0);
      expect(stats.totalRevenue).toBe(0);
      expect(stats.averageOrderValue).toBe(0);
    });
  });

  describe('ship', () => {
    it('sets status to Shipped', async () => {
      const shippedSo = { ...savedSo, status: 'Shipped' };
      MockModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(shippedSo) });

      const result = await service.ship('507f1f77bcf86cd799439098', USER_ID);

      expect(MockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439098',
        expect.objectContaining({ status: 'Shipped' }),
        { new: true },
      );
      expect(result).toEqual(shippedSo);
    });
  });

  describe('remove', () => {
    it('deletes by id and returns id', async () => {
      MockModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue(savedSo) });

      const result = await service.remove('507f1f77bcf86cd799439098', USER_ID, TENANT_ID);

      expect(MockModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439098');
      expect(result).toEqual({ id: '507f1f77bcf86cd799439098' });
    });
  });
});
