import { COMMENT_SORT_DIRECTION } from '../types/comment-sort-direction.enum';
import { COMMENT_SORT_FIELD } from '../types/comment-sort-field.enum';
import { COMMENT_SOURCE_KIND } from '../types/comment-source-kind.enum';
import { CommentValidationError } from '../types/comment-validation-error';
import { COMMENT_VALIDATION_ERROR_CODE } from '../types/comment-validation-error-code.enum';
import { IGetCommentsRequest } from '../types/get-comments-request.interface';
import { CommentRequestValidator } from './comment-request-validator.service';

describe('CommentRequestValidator', () => {
  let validator: CommentRequestValidator;

  beforeEach(() => {
    validator = new CommentRequestValidator();
  });

  it('rejects empty source references', () => {
    expect(() =>
      validator.validate({
        source: {
          kind: COMMENT_SOURCE_KIND.REDDIT_COMMUNITY,
        },
      }),
    ).toThrow(
      new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.INVALID_SOURCE_REFERENCE,
        'Comment sources require an externalId or url.',
      ),
    );
  });

  it('rejects invalid source urls', () => {
    expect(() =>
      validator.validate({
        source: {
          kind: COMMENT_SOURCE_KIND.REDDIT_COMMUNITY,
          url: 'not a url',
        },
      }),
    ).toThrow(
      new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.INVALID_SOURCE_REFERENCE,
        'Comment source URL must be valid.',
      ),
    );
  });

  it('rejects unsupported source kinds before adapter execution', () => {
    const request = JSON.parse(
      '{"source":{"kind":"journal-feed","url":"https://example.publisher.local/rss"}}',
    );

    expect(() => validator.validate(request)).toThrow(
      new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.UNSUPPORTED_SOURCE_KIND,
        'Source kind "journal-feed" is not supported.',
      ),
    );
  });

  it('rejects score percentiles outside the allowed range', () => {
    expect(() =>
      validator.validate({
        source: {
          kind: COMMENT_SOURCE_KIND.REDDIT_COMMUNITY,
          externalId: 't3_abc123',
        },
        filters: {
          scorePercentile: 101,
        },
      }),
    ).toThrow(
      new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.INVALID_SCORE_PERCENTILE,
        'scorePercentile must be between 0 and 100.',
      ),
    );
  });

  it('rejects limits outside the allowed range', () => {
    expect(() =>
      validator.validate({
        source: {
          kind: COMMENT_SOURCE_KIND.REDDIT_COMMUNITY,
          externalId: 't3_abc123',
        },
        limit: 201,
      }),
    ).toThrow(
      new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.INVALID_LIMIT,
        'limit must be an integer between 1 and 200.',
      ),
    );
  });

  it('rejects invalid depth bounds', () => {
    expect(() =>
      validator.validate({
        source: {
          kind: COMMENT_SOURCE_KIND.REDDIT_COMMUNITY,
          externalId: 't3_abc123',
        },
        filters: {
          minDepth: 4,
          maxDepth: 2,
        },
      }),
    ).toThrow(
      new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.INVALID_DEPTH_RANGE,
        'minDepth must be less than or equal to maxDepth.',
      ),
    );
  });

  it('allows open depth bounds', () => {
    const request: IGetCommentsRequest = {
      source: {
        kind: COMMENT_SOURCE_KIND.REDDIT_COMMUNITY,
        externalId: 't3_abc123',
      },
      filters: {
        minDepth: null,
        maxDepth: 5,
      },
    };

    expect(validator.validate(request).filters).toEqual({
      maxDepth: 5,
      includeUnavailable: false,
    });
  });

  it('rejects invalid date range ends', () => {
    expect(() =>
      validator.validate({
        source: {
          kind: COMMENT_SOURCE_KIND.REDDIT_COMMUNITY,
          externalId: 't3_abc123',
        },
        filters: {
          publishedFrom: '2026-08-06T00:00:00.000Z',
          publishedTo: '2026-08-05T00:00:00.000Z',
        },
      }),
    ).toThrow(
      new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.INVALID_PUBLISHED_RANGE,
        'publishedFrom must be before or equal to publishedTo.',
      ),
    );
  });

  it('accepts valid requests and applies defaults', () => {
    const request: IGetCommentsRequest = {
      source: {
        kind: COMMENT_SOURCE_KIND.HACKER_NEWS_QUERY,
        externalId: '12345',
        url: 'https://news.ycombinator.com/item?id=12345',
      },
      filters: {
        minDepth: 0,
        maxDepth: 5,
        publishedFrom: '2026-08-05T10:00:00.000Z',
        publishedTo: null,
        minScore: 2,
        includeUnavailable: true,
      },
      sort: {
        by: COMMENT_SORT_FIELD.PUBLISHED_AT,
        direction: COMMENT_SORT_DIRECTION.ASC,
      },
    };

    expect(validator.validate(request)).toEqual({
      source: request.source,
      filters: {
        minDepth: 0,
        maxDepth: 5,
        publishedFrom: new Date('2026-08-05T10:00:00.000Z'),
        minScore: 2,
        includeUnavailable: true,
      },
      sort: {
        by: COMMENT_SORT_FIELD.PUBLISHED_AT,
        direction: COMMENT_SORT_DIRECTION.ASC,
      },
      limit: 50,
    });
  });

  it('defaults to score descending sort', () => {
    expect(
      validator.validate({
        source: {
          kind: COMMENT_SOURCE_KIND.REDDIT_COMMUNITY,
          externalId: 't3_abc123',
        },
      }).sort,
    ).toEqual({
      by: COMMENT_SORT_FIELD.SCORE,
      direction: COMMENT_SORT_DIRECTION.DESC,
    });
  });
});
