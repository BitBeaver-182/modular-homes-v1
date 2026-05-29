import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiErrorDetail, isApiErrorHttpResponse } from '../errors/api-error';

interface ApiErrorResponse {
  data: null;
  error: {
    status: number;
    name: string;
    message: string;
    details: {
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
    const errors = getErrorDetails(
      rawResponse,
      exception.name,
      status,
      message,
    );

    return {
      data: null,
      error: {
        status,
        name: exception.name,
        message,
        details: { errors },
      },
    };
  }

  const message = 'Internal server error';

  return {
    data: null,
    error: {
      status,
      name: 'InternalServerError',
      message,
      details: {
        errors: [
          {
            path: [],
            message,
            name: 'InternalServerError',
            key: 'http.internalServerError',
          },
        ],
      },
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

function getErrorDetails(
  response: string | object,
  exceptionName: string,
  status: number,
  message: string,
): ApiErrorDetail[] {
  if (isApiErrorHttpResponse(response) && response.errors?.length) {
    return response.errors;
  }

  if (
    typeof response !== 'string' &&
    hasStringArrayProperty(response, 'message')
  ) {
    return response.message.map((detailMessage) => ({
      path: getPathFromValidationMessage(detailMessage),
      message: detailMessage,
      name: 'ValidationError',
      key: 'validation.unknown',
    }));
  }

  return [
    {
      path: [],
      message,
      name: exceptionName,
      key: getHttpErrorKey(status),
    },
  ];
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

function getHttpErrorKey(status: number): string {
  if (status === 400) {
    return 'http.badRequest';
  }

  if (status === 401) {
    return 'http.unauthorized';
  }

  if (status === 403) {
    return 'http.forbidden';
  }

  if (status === 404) {
    return 'http.notFound';
  }

  return 'http.error';
}
