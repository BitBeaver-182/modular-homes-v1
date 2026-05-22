export const PLATFORM_ROUTE_PREFIX = '';

export function platformPath(path: string): string {
  if (PLATFORM_ROUTE_PREFIX === '') {
    return path;
  }

  return [PLATFORM_ROUTE_PREFIX, path].join('/');
}
