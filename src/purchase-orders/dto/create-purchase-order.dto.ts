export class CreatePurchaseOrderDto {
  po_number: string;
  vendor_id: string;
  items: Record<string, any>[];
  custom_fields: Record<string, any>;
}
