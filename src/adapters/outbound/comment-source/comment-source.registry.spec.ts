import { ILatestCommentSourceRequest } from '../../../app/comment/get-latest-comments-request.interface';
import { LATEST_COMMENT_SOURCE_KIND } from '../../../app/comment/latest-comment-source-kind.enum';
import { LatestCommentValidationError } from '../../../app/comment/latest-comment-validation-error';
import { LATEST_COMMENT_VALIDATION_ERROR_CODE } from '../../../app/comment/latest-comment-validation-error-code.enum';
import { ICommentSourcePort } from '../../../ports/outbound/comment-source/comment-source.port';
import { CommentSourceRegistry } from './comment-source.registry';

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
