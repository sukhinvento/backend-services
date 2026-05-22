import { PartialType } from '@nestjs/swagger';
import { CreatePatientMedicationDto } from './create-patient-medication.dto';

export class UpdatePatientMedicationDto extends PartialType(CreatePatientMedicationDto) {}
