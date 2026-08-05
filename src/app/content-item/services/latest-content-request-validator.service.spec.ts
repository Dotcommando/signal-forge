import { LatestContentRequestValidator } from '../services/latest-content-request-validator.service';
import { IGetLatestContentItemsRequest } from '../types/get-latest-content-items-request.interface';
import { JOURNAL_API_PROVIDER } from '../types/journal-api-provider.enum';
import { LATEST_CONTENT_SOURCE_KIND } from '../types/latest-content-source-kind.enum';
import { LatestContentValidationError } from '../types/latest-content-validation-error';
import { LATEST_CONTENT_VALIDATION_ERROR_CODE } from '../types/latest-content-validation-error-code.enum';
import { REDDIT_COMMUNITY_SORT } from '../types/reddit-community-sort.enum';

describe('LatestContentRequestValidator', () => {
  let validator: LatestContentRequestValidator;

  beforeEach(() => {
    validator = new LatestContentRequestValidator();
  });

  it('rejects empty source lists', () => {
    expect(() => validator.validate({ sources: [] })).toThrow(
      new LatestContentValidationError(
        LATEST_CONTENT_VALIDATION_ERROR_CODE.EMPTY_SOURCES,
        'At least one source is required.',
      ),
    );
  });

  it('rejects unsupported source kinds', () => {
    const request = JSON.parse(
      '{"sources":[{"kind":"unsupported-source","community":"psychology"}]}',
    );

    expect(() => validator.validate(request)).toThrow(
      new LatestContentValidationError(
        LATEST_CONTENT_VALIDATION_ERROR_CODE.UNSUPPORTED_SOURCE_KIND,
        'Source kind "unsupported-source" is not supported.',
      ),
    );
  });

  it('rejects limits outside the allowed range', () => {
    expect(() =>
      validator.validate({
        sources: [
          {
            kind: LATEST_CONTENT_SOURCE_KIND.REDDIT_COMMUNITY,
            community: 'psychology',
          },
        ],
        limitPerSource: 51,
      }),
    ).toThrow(
      new LatestContentValidationError(
        LATEST_CONTENT_VALIDATION_ERROR_CODE.INVALID_LIMIT_PER_SOURCE,
        'limitPerSource must be an integer between 1 and 50.',
      ),
    );
  });

  it('accepts valid Reddit, Hacker News, journal API, and journal feed requests', () => {
    const request: IGetLatestContentItemsRequest = {
      sources: [
        {
          kind: LATEST_CONTENT_SOURCE_KIND.REDDIT_COMMUNITY,
          community: 'psychology',
          sort: REDDIT_COMMUNITY_SORT.NEW,
        },
        {
          kind: LATEST_CONTENT_SOURCE_KIND.HACKER_NEWS_QUERY,
          query: 'psychology OR mental health',
        },
        {
          kind: LATEST_CONTENT_SOURCE_KIND.JOURNAL_API_QUERY,
          provider: JOURNAL_API_PROVIDER.CROSSREF,
          query: 'clinical psychology',
          fromPublishedDate: '2026-01-01',
        },
        {
          kind: LATEST_CONTENT_SOURCE_KIND.JOURNAL_FEED,
          url: 'https://example.publisher.local/rss',
        },
      ],
    };

    expect(validator.validate(request)).toEqual({
      sources: request.sources,
      limitPerSource: 20,
    });
  });
});
