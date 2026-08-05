import { Controller, Get } from '@nestjs/common';

import type { IGetHealthResult } from '../../../../app/health/types/get-health-result.interface';
import { GetHealthUseCase } from '../../../../app/health/use-cases/get-health.use-case';

@Controller('health')
export class HealthController {
  constructor(private readonly getHealthUseCase: GetHealthUseCase) {}

  @Get()
  getHealth(): IGetHealthResult {
    return this.getHealthUseCase.execute();
  }
}
