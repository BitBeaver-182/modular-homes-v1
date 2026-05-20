import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  it('delegates to HealthService', () => {
    const service = new HealthService();
    const getStatusSpy = jest.spyOn(service, 'getStatus').mockReturnValue({
      status: 'ok',
      service: 'api',
      timestamp: '2026-05-15T00:00:00.000Z',
    });

    const controller = new HealthController(service);

    expect(controller.getHealthStatus()).toEqual({
      status: 'ok',
      service: 'api',
      timestamp: '2026-05-15T00:00:00.000Z',
    });
    expect(getStatusSpy).toHaveBeenCalledTimes(1);
  });
});
