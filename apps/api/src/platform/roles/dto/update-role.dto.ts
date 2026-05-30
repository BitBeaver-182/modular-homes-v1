import type { UpdateRoleRequest } from '@moduflow/types';
import { PartialType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';

export class UpdateRoleDto
  extends PartialType(CreateRoleDto)
  implements UpdateRoleRequest {}
