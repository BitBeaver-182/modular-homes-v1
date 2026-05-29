import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

interface ApiErrorDetail {
  path: Array<string | number>;
  message: string;
  name: string;
}

interface ApiErrorResponse {
  data: null;
  error: {
    status: number;
    name: string;
    message: string;
    details?: {
      errors: ApiErrorDetail[];
    };
  };
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json(toApiErrorResponse(exception, status));
  }
}

function toApiErrorResponse(
  exception: unknown,
  status: number,
): ApiErrorResponse {
  if (exception instanceof HttpException) {
    const rawResponse = exception.getResponse();
    const message = getMessage(rawResponse) ?? exception.message;
    const errors = getValidationErrors(rawResponse);

    return {
      data: null,
      error: {
        status,
        name: exception.name,
        message,
        ...(errors.length > 0 ? { details: { errors } } : {}),
      },
    };
  }

  return {
    data: null,
    error: {
      status,
      name: 'InternalServerError',
      message: 'Internal server error',
    },
  };
}

function getMessage(response: string | object): string | undefined {
  if (typeof response === 'string') {
    return response;
  }

  if (hasStringProperty(response, 'message')) {
    return response.message;
  }

  if (hasStringArrayProperty(response, 'message')) {
    return response.message.join('\n');
  }

  return undefined;
}

function getValidationErrors(response: string | object): ApiErrorDetail[] {
  if (
    typeof response === 'string' ||
    !hasStringArrayProperty(response, 'message')
  ) {
    return [];
  }

  return response.message.map((message) => ({
    path: getPathFromValidationMessage(message),
    message,
    name: 'ValidationError',
  }));
}

function getPathFromValidationMessage(message: string): string[] {
  const [field] = message.split(' ');
  return field ? field.split('.') : [];
}

function hasStringProperty<T extends string>(
  value: unknown,
  property: T,
): value is Record<T, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    property in value &&
    typeof (value as Record<T, unknown>)[property] === 'string'
  );
}

function hasStringArrayProperty<T extends string>(
  value: unknown,
  property: T,
): value is Record<T, string[]> {
  if (typeof value !== 'object' || value === null || !(property in value)) {
    return false;
  }

  const propertyValue = (value as Record<T, unknown>)[property];
  return (
    Array.isArray(propertyValue) &&
    propertyValue.every((item: unknown) => typeof item === 'string')
  );
}
