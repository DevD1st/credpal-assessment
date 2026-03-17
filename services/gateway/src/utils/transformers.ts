import { TransformFnParams } from 'class-transformer';

export function transformToLowercase(param: TransformFnParams) {
  if (!param.value) return param.value;

  const transformedData = (param.value as string).toString().toLowerCase();

  param.obj[param.key] = transformedData;
  param.value = transformedData;
  return transformedData;
}