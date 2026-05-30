import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { PhoneNumberUtil } from 'google-libphonenumber';

const phoneUtil = PhoneNumberUtil.getInstance();

export function IsGooglePhoneNumber(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'isGooglePhoneNumber',
      target: target.constructor,
      propertyName: String(propertyName),
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string' || value.trim().length === 0) {
            return true;
          }

          try {
            const phoneNumber = phoneUtil.parse(value.trim());
            return phoneUtil.isValidNumber(phoneNumber);
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid phone number`;
        },
      },
    });
  };
}
