import { Controller, Get } from '@nestjs/common';

import { GetHealthUseCase } from '../../../../app/health/get-health.use-case';
import type { IGetHealthResult } from '../../../../app/health/get-health-result.interface';

@Controller('health')
export class HealthController {
  constructor(private readonly getHealthUseCase: GetHealthUseCase) {}

  @Get()
  getHealth(): IGetHealthResult {
    return this.getHealthUseCase.execute();
  }
}
