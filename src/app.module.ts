import { Module } from '@nestjs/common';

import { HealthController } from './adapters/inbound/http/controllers/health.controller';
import { GetHealthUseCase } from './app/health/get-health.use-case';

@Module({
  imports: [],
  controllers: [HealthController],
  providers: [GetHealthUseCase],
})
export class AppModule {}
