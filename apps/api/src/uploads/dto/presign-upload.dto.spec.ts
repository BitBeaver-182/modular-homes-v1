import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PresignUploadBodyDto } from './presign-upload.dto';

function validateUploadBody(input: Record<string, unknown>) {
  const dto = plainToInstance(PresignUploadBodyDto, input);
  return {
    dto,
    errors: validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  };
}

describe('PresignUploadBodyDto', () => {
  it('accepts supported filename characters and trims scalars', () => {
    const { dto, errors } = validateUploadBody({
      filename: '  floor_plan-v1.2 final.pdf  ',
      mimeType: ' application/pdf ',
      context: 'SUPPLIER_DOCUMENT',
    });

    expect(errors).toHaveLength(0);
    expect(dto.filename).toBe('floor_plan-v1.2 final.pdf');
    expect(dto.mimeType).toBe('application/pdf');
  });

  it.each([
    ['slash', 'folder/file.pdf'],
    ['backslash', 'folder\\file.pdf'],
    ['control character', 'floor\nplan.pdf'],
    ['unsupported symbol', 'floor#plan.pdf'],
  ])('rejects filenames with %s', (_label, filename) => {
    const { errors } = validateUploadBody({
      filename,
      mimeType: 'application/pdf',
      context: 'SUPPLIER_DOCUMENT',
    });

    expect(errors).not.toHaveLength(0);
  });

  it('rejects filenames over 255 characters', () => {
    const { errors } = validateUploadBody({
      filename: `${'a'.repeat(256)}.pdf`,
      mimeType: 'application/pdf',
      context: 'SUPPLIER_DOCUMENT',
    });

    expect(errors).not.toHaveLength(0);
  });
});
