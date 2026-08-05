import { ICommentSourcePort } from '../../ports/outbound/comment-source/comment-source.port';
import { LATEST_COMMENT_SOURCE_KIND } from '../../ports/outbound/comment-source/latest-comment-source-kind.enum';
import { ILatestCommentSourceRequest } from '../../ports/outbound/comment-source/latest-comment-source-request.interface';
import { CommentSourceRegistry } from './comment-source.registry';
import { LatestCommentValidationError } from './latest-comment-validation-error';
import { LATEST_COMMENT_VALIDATION_ERROR_CODE } from './latest-comment-validation-error-code.enum';

class FakeCommentSourceAdapter implements ICommentSourcePort {
  public fetchCalls = 0;

  constructor(private readonly supportedKind: LATEST_COMMENT_SOURCE_KIND) {}

  supports(source: ILatestCommentSourceRequest): boolean {
    return source.kind === this.supportedKind;
  }

  async fetchLatestComments(): Promise<[]> {
    this.fetchCalls += 1;

    return [];
  }
}

describe('CommentSourceRegistry', () => {
  it('selects an adapter by source kind', () => {
    const redditAdapter = new FakeCommentSourceAdapter(
      LATEST_COMMENT_SOURCE_KIND.REDDIT_COMMUNITY,
    );
    const hackerNewsAdapter = new FakeCommentSourceAdapter(
      LATEST_COMMENT_SOURCE_KIND.HACKER_NEWS_QUERY,
    );
    const registry = new CommentSourceRegistry([
      redditAdapter,
      hackerNewsAdapter,
    ]);

    expect(
      registry.get({
        kind: LATEST_COMMENT_SOURCE_KIND.HACKER_NEWS_QUERY,
        externalId: '12345',
      }),
    ).toBe(hackerNewsAdapter);
  });

  it('rejects unsupported source kinds before adapter execution', () => {
    const adapter = new FakeCommentSourceAdapter(
      LATEST_COMMENT_SOURCE_KIND.REDDIT_COMMUNITY,
    );
    const registry = new CommentSourceRegistry([adapter]);

    expect(() =>
      registry.get({
        kind: LATEST_COMMENT_SOURCE_KIND.HACKER_NEWS_QUERY,
        externalId: '12345',
      }),
    ).toThrow(
      new LatestCommentValidationError(
        LATEST_COMMENT_VALIDATION_ERROR_CODE.UNSUPPORTED_SOURCE_KIND,
        'No comment source adapter supports "hacker-news-query".',
      ),
    );
    expect(adapter.fetchCalls).toBe(0);
  });
});
