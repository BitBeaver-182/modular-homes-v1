import type { UpdatePermissionRequest } from '@moduflow/types';
import { PartialType } from '@nestjs/swagger';
import { CreatePermissionDto } from './create-permission.dto';

export class UpdatePermissionDto
  extends PartialType(CreatePermissionDto)
  implements UpdatePermissionRequest {}
