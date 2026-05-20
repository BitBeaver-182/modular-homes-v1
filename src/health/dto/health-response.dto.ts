import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: 'api' })
  service!: string;

  @ApiProperty({ example: '2026-05-15T10:00:00.000Z' })
  timestamp!: string;
}
