import { Test, TestingModule } from '@nestjs/testing';

import { GetHealthUseCase } from '../../../../app/health/get-health.use-case';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let getHealthUseCase: jest.Mocked<GetHealthUseCase>;

  beforeEach(async () => {
    getHealthUseCase = {
      execute: jest.fn().mockReturnValue({ status: 'ok' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: GetHealthUseCase,
          useValue: getHealthUseCase,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('delegates health checks to the use case', () => {
    expect(controller.getHealth()).toEqual({ status: 'ok' });
    expect(getHealthUseCase.execute).toHaveBeenCalledTimes(1);
  });
});
