export class CreateInvoiceDto {
  invoice_number: string;
  order_id: string;
  amount: number;
  custom_fields: Record<string, any>;
}
