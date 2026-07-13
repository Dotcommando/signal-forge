import { GetHealthUseCase } from './get-health.use-case';

describe('GetHealthUseCase', () => {
  it('returns process-level health for the current phase', () => {
    const useCase = new GetHealthUseCase();

    expect(useCase.execute()).toEqual({ status: 'ok' });
  });
});
