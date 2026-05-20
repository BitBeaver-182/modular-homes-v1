import { of, lastValueFrom } from 'rxjs';
import {
  BigIntSerializerInterceptor,
  serializeBigInts,
} from './bigint-serializer.interceptor';

describe('BigIntSerializerInterceptor', () => {
  it('serializes nested bigint values to strings', () => {
    expect(
      serializeBigInts({
        id: 1n,
        memberships: [{ id: 2n, userId: 1n }],
      }),
    ).toEqual({
      id: '1',
      memberships: [{ id: '2', userId: '1' }],
    });
  });

  it('maps response values through the serializer', async () => {
    const interceptor = new BigIntSerializerInterceptor();

    await expect(
      lastValueFrom(
        interceptor.intercept({} as never, {
          handle: () => of({ id: 1n }),
        }),
      ),
    ).resolves.toEqual({ id: '1' });
  });
});
