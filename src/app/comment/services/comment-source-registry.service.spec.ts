import { ICommentSourcePort } from '../../../ports/outbound/comment-source/comment-source.port';
import { COMMENT_SOURCE_KIND } from '../../../ports/outbound/comment-source/comment-source-kind.enum';
import { ICommentSourceRequest } from '../../../ports/outbound/comment-source/comment-source-request.interface';
import { CommentValidationError } from '../types/comment-validation-error';
import { COMMENT_VALIDATION_ERROR_CODE } from '../types/comment-validation-error-code.enum';
import { CommentSourceRegistry } from './comment-source-registry.service';

class FakeCommentSourceAdapter implements ICommentSourcePort {
  public fetchCalls = 0;

  constructor(private readonly supportedKind: COMMENT_SOURCE_KIND) {}

  supports(source: ICommentSourceRequest): boolean {
    return source.kind === this.supportedKind;
  }

  async fetchComments(): Promise<[]> {
    this.fetchCalls += 1;

    return [];
  }
}

describe('CommentSourceRegistry', () => {
  it('selects an adapter by source kind', () => {
    const redditAdapter = new FakeCommentSourceAdapter(
      COMMENT_SOURCE_KIND.REDDIT_COMMUNITY,
    );
    const hackerNewsAdapter = new FakeCommentSourceAdapter(
      COMMENT_SOURCE_KIND.HACKER_NEWS_QUERY,
    );
    const registry = new CommentSourceRegistry([
      redditAdapter,
      hackerNewsAdapter,
    ]);

    expect(
      registry.get({
        kind: COMMENT_SOURCE_KIND.HACKER_NEWS_QUERY,
        externalId: '12345',
      }),
    ).toBe(hackerNewsAdapter);
  });

  it('rejects unsupported source kinds before adapter execution', () => {
    const adapter = new FakeCommentSourceAdapter(
      COMMENT_SOURCE_KIND.REDDIT_COMMUNITY,
    );
    const registry = new CommentSourceRegistry([adapter]);

    expect(() =>
      registry.get({
        kind: COMMENT_SOURCE_KIND.HACKER_NEWS_QUERY,
        externalId: '12345',
      }),
    ).toThrow(
      new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.UNSUPPORTED_SOURCE_KIND,
        'No comment source adapter supports "hacker-news-query".',
      ),
    );
    expect(adapter.fetchCalls).toBe(0);
  });
});
