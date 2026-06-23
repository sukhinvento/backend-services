import { PartialType } from '@nestjs/swagger';
import { CreateEmployeeSalaryDto } from './create-employee-salary.dto';

export class UpdateEmployeeSalaryDto extends PartialType(CreateEmployeeSalaryDto) {}
