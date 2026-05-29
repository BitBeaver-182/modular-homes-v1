import { BadRequestException, ValidationError } from '@nestjs/common';

export interface ApiErrorDetail {
  path: Array<string | number>;
  message: string;
  name: string;
  key?: string | null;
  params?: Record<string, string | number>;
}

export interface ApiErrorHttpResponse {
  message: string;
  errors?: ApiErrorDetail[];
}

export function createApiErrorDetail(detail: ApiErrorDetail): ApiErrorDetail {
  return detail;
}

export function createApiErrorResponse(
  message: string,
  errors: ApiErrorDetail[],
): ApiErrorHttpResponse {
  return {
    message,
    errors,
  };
}

export function createBadRequestException(
  message: string,
  errors: ApiErrorDetail[],
): BadRequestException {
  return new BadRequestException(createApiErrorResponse(message, errors));
}

export function createValidationException(
  errors: ValidationError[],
): BadRequestException {
  const details = flattenValidationErrors(errors);

  return new BadRequestException(
    createApiErrorResponse('Validation error', details),
  );
}

export function isApiErrorHttpResponse(
  value: unknown,
): value is ApiErrorHttpResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if (!('message' in value) || typeof value.message !== 'string') {
    return false;
  }

  if (!('errors' in value) || value.errors === undefined) {
    return true;
  }

  return (
    Array.isArray(value.errors) &&
    value.errors.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        Array.isArray((item as ApiErrorDetail).path) &&
        typeof (item as ApiErrorDetail).message === 'string' &&
        typeof (item as ApiErrorDetail).name === 'string',
    )
  );
}

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath: string[] = [],
): ApiErrorDetail[] {
  return errors.flatMap((error) => {
    const path = [...parentPath, error.property];
    const ownErrors = Object.entries(error.constraints ?? {}).map(
      ([constraint, message]) =>
        createApiErrorDetail({
          path,
          message,
          name: 'ValidationError',
          key: getValidationErrorKey(constraint),
          params: getValidationErrorParams(constraint, message),
        }),
    );

    const childErrors = flattenValidationErrors(error.children ?? [], path);
    return [...ownErrors, ...childErrors];
  });
}

function getValidationErrorKey(constraint: string): string | null {
  const keyMap: Record<string, string> = {
    isEmail: 'validation.email',
    isGooglePhoneNumber: 'validation.phone',
    isISO31661Alpha2: 'validation.countryCode',
    isNotEmpty: 'validation.required',
    isString: 'validation.string',
    isUrl: 'validation.url',
    maxLength: 'validation.maxLength',
    minLength: 'validation.minLength',
  };

  return keyMap[constraint] ?? 'validation.unknown';
}

function getValidationErrorParams(
  constraint: string,
  message: string,
): Record<string, string | number> | undefined {
  const numericValue = extractFirstNumber(message);

  if (constraint === 'maxLength' && numericValue !== undefined) {
    return { max: numericValue };
  }

  if (constraint === 'minLength' && numericValue !== undefined) {
    return { min: numericValue };
  }

  return undefined;
}

function extractFirstNumber(message: string): number | undefined {
  const match = message.match(/\d+/);
  if (!match) {
    return undefined;
  }

  return Number(match[0]);
}
