export class CreateAuditLogDto<T> {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: T;
  newValue?: T;
  tenantId: string;
}
