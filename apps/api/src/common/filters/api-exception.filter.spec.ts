import { ArgumentsHost, NotFoundException } from '@nestjs/common';
import { ApiExceptionFilter } from './api-exception.filter';
import {
  createApiErrorDetail,
  createBadRequestException,
} from '../errors/api-error';

describe('ApiExceptionFilter', () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const response = { status };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  } as ArgumentsHost;

  beforeEach(() => {
    jest.resetAllMocks();
    status.mockReturnValue({ json });
  });

  it('returns Strapi-style field errors for structured bad requests', () => {
    const filter = new ApiExceptionFilter();
    const exception = createBadRequestException('Supplier name must be unique', [
      createApiErrorDetail({
        path: ['name'],
        message: 'name must be unique inside the active organization',
        name: 'ValidationError',
        key: 'validation.unique',
      }),
    ]);

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      data: null,
      error: {
        status: 400,
        name: 'BadRequestException',
        message: 'Supplier name must be unique',
        details: {
          errors: [
            {
              path: ['name'],
              message: 'name must be unique inside the active organization',
              name: 'ValidationError',
              key: 'validation.unique',
            },
          ],
        },
      },
    });
  });

  it('adds a root machine code for generic http errors', () => {
    const filter = new ApiExceptionFilter();

    filter.catch(new NotFoundException('Supplier not found'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      data: null,
      error: {
        status: 404,
        name: 'NotFoundException',
        message: 'Supplier not found',
        details: {
          errors: [
            {
              path: [],
              message: 'Supplier not found',
              name: 'NotFoundException',
              key: 'http.notFound',
            },
          ],
        },
      },
    });
  });
});
