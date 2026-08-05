import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { HealthController } from './adapters/inbound/http/controllers/health.controller';
import { LatestContentController } from './adapters/inbound/http/controllers/latest-content.controller';
import { HackerNewsApiClient } from './adapters/outbound/content-source/hacker-news/hacker-news-api.client';
import { HackerNewsContentMapper } from './adapters/outbound/content-source/hacker-news/hacker-news-content.mapper';
import { HackerNewsContentSourceAdapter } from './adapters/outbound/content-source/hacker-news/hacker-news-content-source.adapter';
import { RedditApiClient } from './adapters/outbound/content-source/reddit/reddit-api.client';
import { RedditContentMapper } from './adapters/outbound/content-source/reddit/reddit-content.mapper';
import { RedditContentSourceAdapter } from './adapters/outbound/content-source/reddit/reddit-content-source.adapter';
import { ContentSourceRegistry } from './app/content-item/content-source.registry';
import { GetLatestContentItemsUseCase } from './app/content-item/get-latest-content-items.use-case';
import { LatestContentRequestValidator } from './app/content-item/latest-content-request-validator';
import { GetHealthUseCase } from './app/health/get-health.use-case';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [HealthController, LatestContentController],
  providers: [
    GetHealthUseCase,
    GetLatestContentItemsUseCase,
    LatestContentRequestValidator,
    {
      provide: ContentSourceRegistry,
      useFactory: (configService: ConfigService) =>
        new ContentSourceRegistry([
          new RedditContentSourceAdapter(
            new RedditApiClient({
              clientId: configService.get<string>('REDDIT_CLIENT_ID') ?? '',
              clientSecret: configService.get<string>('REDDIT_CLIENT_SECRET') ?? '',
              userAgent: configService.get<string>('REDDIT_USER_AGENT') ?? 'signal-forge/0.1.0',
            }),
            new RedditContentMapper(),
          ),
          new HackerNewsContentSourceAdapter(
            new HackerNewsApiClient(),
            new HackerNewsContentMapper(),
          ),
        ]),
      inject: [ConfigService],
    },
  ],
})
export class AppModule {}
