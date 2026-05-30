import type { UpdateOrganizationRequest } from '@moduflow/types';
import { PartialType } from '@nestjs/swagger';
import { CreateOrganizationDto } from './create-organization.dto';

export class UpdateOrganizationDto
  extends PartialType(CreateOrganizationDto)
  implements UpdateOrganizationRequest {}
