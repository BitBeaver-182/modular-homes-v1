import type { HealthResponse } from '@moduflow/types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class HealthResponseDto implements HealthResponse {
  constructor(partial: HealthResponse) {
    Object.assign(this, partial);
  }

  @Expose()
  @ApiProperty({ example: 'ok' })
  status!: string;

  @Expose()
  @ApiProperty({ example: 'api' })
  service!: string;

  @Expose()
  @ApiProperty({ example: '2026-05-15T10:00:00.000Z' })
  timestamp!: string;
}
