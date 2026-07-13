import { Module } from '@nestjs/common';

import { HealthController } from './adapters/inbound/http/controllers/health.controller';
import { LatestContentController } from './adapters/inbound/http/controllers/latest-content.controller';
import { ContentSourceRegistry } from './adapters/outbound/content-source/content-source.registry';
import { GetLatestContentItemsUseCase } from './app/content-item/get-latest-content-items.use-case';
import { LatestContentRequestValidator } from './app/content-item/latest-content-request-validator';
import { GetHealthUseCase } from './app/health/get-health.use-case';

@Module({
  imports: [],
  controllers: [HealthController, LatestContentController],
  providers: [
    GetHealthUseCase,
    GetLatestContentItemsUseCase,
    LatestContentRequestValidator,
    {
      provide: ContentSourceRegistry,
      useFactory: () => new ContentSourceRegistry([]),
    },
  ],
})
export class AppModule {}
