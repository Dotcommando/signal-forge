import { ContentSourceRegistry } from '../../adapters/outbound/content-source/content-source.registry';
import { IContentItem } from '../../domain/content-item';
import { IContentSourcePort } from '../../ports/outbound/content-source/content-source.port';
import { GetLatestContentItemsUseCase } from './get-latest-content-items.use-case';
import { ILatestContentSourceRequest } from './get-latest-content-items-request.interface';
import { JOURNAL_API_PROVIDER } from './journal-api-provider.enum';
import { LATEST_CONTENT_ERROR_CODE } from './latest-content-error-code.enum';
import { LatestContentRequestValidator } from './latest-content-request-validator';
import { LATEST_CONTENT_SOURCE_KIND } from './latest-content-source-kind.enum';

class FakeContentSourceAdapter implements IContentSourcePort {
  constructor(
    private readonly supportedKind: LATEST_CONTENT_SOURCE_KIND,
    private readonly items: IContentItem[],
    private readonly error?: Error,
  ) {}

  supports(source: ILatestContentSourceRequest): boolean {
    return source.kind === this.supportedKind;
  }

  async fetchLatestContentItems(): Promise<IContentItem[]> {
    if (this.error) {
      throw this.error;
    }

    return this.items;
  }
}

describe('GetLatestContentItemsUseCase', () => {
  it('invokes selected adapters for each source and merges normalized items', async () => {
    const item = createContentItem('reddit-1');
    const useCase = new GetLatestContentItemsUseCase(
      new LatestContentRequestValidator(),
      new ContentSourceRegistry([
        new FakeContentSourceAdapter(
          LATEST_CONTENT_SOURCE_KIND.REDDIT_COMMUNITY,
          [item],
        ),
      ]),
    );

    await expect(
      useCase.execute({
        sources: [
          {
            kind: LATEST_CONTENT_SOURCE_KIND.REDDIT_COMMUNITY,
            community: 'psychology',
          },
        ],
        limitPerSource: 10,
      }),
    ).resolves.toEqual({
      items: [item],
      errors: [],
    });
  });

  it('keeps successful items when one source fails', async () => {
    const item = createContentItem('reddit-1');
    const useCase = new GetLatestContentItemsUseCase(
      new LatestContentRequestValidator(),
      new ContentSourceRegistry([
        new FakeContentSourceAdapter(
          LATEST_CONTENT_SOURCE_KIND.REDDIT_COMMUNITY,
          [item],
        ),
        new FakeContentSourceAdapter(
          LATEST_CONTENT_SOURCE_KIND.JOURNAL_API_QUERY,
          [],
          new Error('Crossref request timed out.'),
        ),
      ]),
    );

    await expect(
      useCase.execute({
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
      items: [item],
      errors: [
        {
          sourceIndex: 1,
          code: LATEST_CONTENT_ERROR_CODE.SOURCE_TEMPORARILY_UNAVAILABLE,
          message: 'Crossref request timed out.',
        },
      ],
    });
  });
});

function createContentItem(id: string): IContentItem {
  return {
    id,
    source: {
      provider: 'reddit',
      externalId: id,
      url: `https://www.reddit.com/comments/${id}/`,
    },
    title: 'Psychology discussion',
    canonicalUrl: `https://www.reddit.com/comments/${id}/`,
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
  };
}
