import { PartialType } from '@nestjs/mapped-types';
import { CreateFulfillmentDto } from './create-fulfillment.dto';

export class UpdateFulfillmentDto extends PartialType(CreateFulfillmentDto) {}
