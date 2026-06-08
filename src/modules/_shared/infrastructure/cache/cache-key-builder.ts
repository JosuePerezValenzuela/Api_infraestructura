export class CacheKeyBuilder {
  static list(resource: string, params: Record<string, any>): string {
    const filtered = Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null,
    );
    const sorted = filtered.sort(([a], [b]) => a.localeCompare(b));
    const queryString = sorted.map(([k, v]) => `${k}=${v}`).join('&');
    return `${resource}:list:${queryString}`;
  }
}
