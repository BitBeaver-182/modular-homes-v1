import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns healthy status payload', () => {
    const service = new HealthService();
    const status = service.getStatus();

    expect(status.status).toBe('ok');
    expect(status.service).toBe('api');
    expect(status.timestamp).toEqual(expect.any(String));
  });
});
