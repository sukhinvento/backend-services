import { PartialType } from '@nestjs/swagger';
import { CreateHospitalBillDto } from './create-hospital-bill.dto';

export class UpdateHospitalBillDto extends PartialType(CreateHospitalBillDto) {}
