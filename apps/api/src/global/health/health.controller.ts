import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { HealthResponseDto } from './dto/health-response.dto';
import { HealthService } from './health.service';
import { toHealthResponse } from './mappers/health.mapper';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @SkipThrottle()
  @ApiOperation({
    summary: 'Get Health',
    description: 'Return the current API health status.',
  })
  @ApiOkResponse({ type: HealthResponseDto })
  getHealthStatus() {
    return plainToInstance(
      HealthResponseDto,
      toHealthResponse(this.healthService.getStatus()),
      { excludeExtraneousValues: true },
    );
  }
}
