import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { HealthController } from '../src/adapters/inbound/http/controllers/health.controller';
import { LatestContentController } from '../src/adapters/inbound/http/controllers/latest-content.controller';
import { ContentSourceRegistry } from '../src/adapters/outbound/content-source/content-source.registry';
import { ILatestContentSourceRequest } from '../src/app/content-item/get-latest-content-items-request.interface';
import { JOURNAL_API_PROVIDER } from '../src/app/content-item/journal-api-provider.enum';
import { LATEST_CONTENT_ERROR_CODE } from '../src/app/content-item/latest-content-error-code.enum';
import { LATEST_CONTENT_SOURCE_KIND } from '../src/app/content-item/latest-content-source-kind.enum';
import { LATEST_CONTENT_VALIDATION_ERROR_CODE } from '../src/app/content-item/latest-content-validation-error-code.enum';
import { AppModule } from './../src/app.module';
import { IContentItem } from './../src/domain/content-item';
import { IContentSourcePort } from './../src/ports/outbound/content-source/content-source.port';

describe('HealthController (e2e)', () => {
  let moduleFixture: TestingModule;
  let healthController: HealthController;
  let latestContentController: LatestContentController;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ContentSourceRegistry)
      .useValue(
        new ContentSourceRegistry([
          new SuccessfulContentSourceAdapter(),
          new FailingContentSourceAdapter(),
        ]),
      )
      .compile();

    healthController = moduleFixture.get<HealthController>(HealthController);
    latestContentController = moduleFixture.get<LatestContentController>(
      LatestContentController,
    );
  });

  it('/health (GET)', () => {
    expect(healthController.getHealth()).toEqual({ status: 'ok' });
  });

  it('/content-items/latest (POST)', async () => {
    await expect(
      latestContentController.getLatestContentItems({
        sources: [
          {
            kind: LATEST_CONTENT_SOURCE_KIND.REDDIT_COMMUNITY,
            community: 'psychology',
          },
          {
            kind: LATEST_CONTENT_SOURCE_KIND.JOURNAL_API_QUERY,
            provider: JOURNAL_API_PROVIDER.CROSSREF,
            query: 'clinical psychology',
          },
        ],
        limitPerSource: 10,
      }),
    ).resolves.toEqual({
        items: [
          {
            id: 'reddit-1',
            source: {
              provider: 'reddit',
              externalId: 'reddit-1',
              url: 'https://www.reddit.com/comments/reddit-1/',
            },
            title: 'Psychology discussion',
            canonicalUrl: 'https://www.reddit.com/comments/reddit-1/',
            channel: {
              name: 'r/psychology',
              url: 'https://www.reddit.com/r/psychology/',
            },
            labels: ['psychology'],
            metrics: {
              score: 12,
              comments: 3,
            },
            files: [],
            retrievedAt: new Date('2026-07-13T08:30:00.000Z'),
          },
        ],
        errors: [
          {
            sourceIndex: 1,
            code: LATEST_CONTENT_ERROR_CODE.SOURCE_TEMPORARILY_UNAVAILABLE,
            message: 'Crossref request timed out.',
          },
        ],
      });
  });

  it('/content-items/latest (POST) rejects invalid requests', async () => {
    await expect(
      latestContentController.getLatestContentItems({
        sources: [],
      }),
    ).rejects.toEqual(
      new BadRequestException({
        code: LATEST_CONTENT_VALIDATION_ERROR_CODE.EMPTY_SOURCES,
        message: 'At least one source is required.',
      }),
    );
  });

  afterEach(async () => {
    await moduleFixture.close();
  });
});

class SuccessfulContentSourceAdapter implements IContentSourcePort {
  supports(source: ILatestContentSourceRequest): boolean {
    return source.kind === LATEST_CONTENT_SOURCE_KIND.REDDIT_COMMUNITY;
  }

  async fetchLatestContentItems(): Promise<IContentItem[]> {
    return [
      {
        id: 'reddit-1',
        source: {
          provider: 'reddit',
          externalId: 'reddit-1',
          url: 'https://www.reddit.com/comments/reddit-1/',
        },
        title: 'Psychology discussion',
        canonicalUrl: 'https://www.reddit.com/comments/reddit-1/',
        channel: {
          name: 'r/psychology',
          url: 'https://www.reddit.com/r/psychology/',
        },
        labels: ['psychology'],
        metrics: {
          score: 12,
          comments: 3,
        },
        files: [],
        retrievedAt: new Date('2026-07-13T08:30:00.000Z'),
      },
    ];
  }
}

class FailingContentSourceAdapter implements IContentSourcePort {
  supports(source: ILatestContentSourceRequest): boolean {
    return source.kind === LATEST_CONTENT_SOURCE_KIND.JOURNAL_API_QUERY;
  }

  async fetchLatestContentItems(): Promise<IContentItem[]> {
    throw new Error('Crossref request timed out.');
  }
}
