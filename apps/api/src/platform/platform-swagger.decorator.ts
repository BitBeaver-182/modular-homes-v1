import { applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiParam } from '@nestjs/swagger';

export function ApiOrganizationHeader() {
  return ApiHeader({
    name: 'x-organization-id',
    description: 'Active organization identifier for platform-scoped routes.',
    required: true,
    schema: {
      type: 'string',
      default: '{{organizationId}}',
      example: '{{organizationId}}',
    },
  });
}

export function ApiBigIntIdParam(name: string, resource: string) {
  return applyDecorators(
    ApiParam({
      name,
      description: `BigInt identifier for the ${resource}.`,
      schema: {
        type: 'string',
        example: '1',
      },
    }),
  );
}
