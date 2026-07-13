import { ILatestContentSourceRequest } from '../../../app/content-item/get-latest-content-items-request.interface';
import { LATEST_CONTENT_SOURCE_KIND } from '../../../app/content-item/latest-content-source-kind.enum';
import { LatestContentValidationError } from '../../../app/content-item/latest-content-validation-error';
import { LATEST_CONTENT_VALIDATION_ERROR_CODE } from '../../../app/content-item/latest-content-validation-error-code.enum';
import { IContentSourcePort } from '../../../ports/outbound/content-source/content-source.port';
import { ContentSourceRegistry } from './content-source.registry';

class FakeContentSourceAdapter implements IContentSourcePort {
  public fetchCalls = 0;

  constructor(private readonly supportedKind: LATEST_CONTENT_SOURCE_KIND) {}

  supports(source: ILatestContentSourceRequest): boolean {
    return source.kind === this.supportedKind;
  }

  async fetchLatestContentItems(): Promise<[]> {
    this.fetchCalls += 1;

    return [];
  }
}

describe('ContentSourceRegistry', () => {
  it('selects an adapter by source kind', () => {
    const redditAdapter = new FakeContentSourceAdapter(
      LATEST_CONTENT_SOURCE_KIND.REDDIT_COMMUNITY,
    );
    const hackerNewsAdapter = new FakeContentSourceAdapter(
      LATEST_CONTENT_SOURCE_KIND.HACKER_NEWS_QUERY,
    );
    const registry = new ContentSourceRegistry([
      redditAdapter,
      hackerNewsAdapter,
    ]);

    expect(
      registry.get({
        kind: LATEST_CONTENT_SOURCE_KIND.HACKER_NEWS_QUERY,
        query: 'psychology',
      }),
    ).toBe(hackerNewsAdapter);
  });

  it('rejects unsupported source kinds before adapter execution', () => {
    const adapter = new FakeContentSourceAdapter(
      LATEST_CONTENT_SOURCE_KIND.REDDIT_COMMUNITY,
    );
    const registry = new ContentSourceRegistry([adapter]);

    expect(() =>
      registry.get({
        kind: LATEST_CONTENT_SOURCE_KIND.HACKER_NEWS_QUERY,
        query: 'psychology',
      }),
    ).toThrow(
      new LatestContentValidationError(
        LATEST_CONTENT_VALIDATION_ERROR_CODE.UNSUPPORTED_SOURCE_KIND,
        'No content source adapter supports "hacker-news-query".',
      ),
    );
    expect(adapter.fetchCalls).toBe(0);
  });
});
