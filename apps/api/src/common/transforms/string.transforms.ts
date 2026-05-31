import type { TransformFnParams } from 'class-transformer';

export const emptyStringToUndefined = ({
  value,
}: TransformFnParams): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export const trimString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

export const trimUppercaseString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;
