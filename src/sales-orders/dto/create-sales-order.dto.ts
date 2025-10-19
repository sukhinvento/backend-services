export class CreateSalesOrderDto {
  so_number: string;
  customer_id: string;
  items: Record<string, any>[];
  custom_fields: Record<string, any>;
}
