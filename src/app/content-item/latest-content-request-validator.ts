import { Injectable } from '@nestjs/common';

import { IGetLatestContentItemsRequest, ILatestContentSourceRequest, IValidatedLatestContentItemsRequest } from './get-latest-content-items-request.interface';
import { JOURNAL_API_PROVIDER_ARRAY } from './journal-api-provider.enum';
import { LATEST_CONTENT_SOURCE_KIND, LATEST_CONTENT_SOURCE_KIND_ARRAY } from './latest-content-source-kind.enum';
import { LatestContentValidationError } from './latest-content-validation-error';
import { LATEST_CONTENT_VALIDATION_ERROR_CODE } from './latest-content-validation-error-code.enum';
import { REDDIT_COMMUNITY_SORT_ARRAY } from './reddit-community-sort.enum';

const DEFAULT_LIMIT_PER_SOURCE = 20;
const MIN_LIMIT_PER_SOURCE = 1;
const MAX_LIMIT_PER_SOURCE = 50;

@Injectable()
export class LatestContentRequestValidator {
  validate(
    request: IGetLatestContentItemsRequest,
  ): IValidatedLatestContentItemsRequest {
    if (request.sources.length === 0) {
      throw new LatestContentValidationError(
        LATEST_CONTENT_VALIDATION_ERROR_CODE.EMPTY_SOURCES,
        'At least one source is required.',
      );
    }

    const limitPerSource = request.limitPerSource ?? DEFAULT_LIMIT_PER_SOURCE;

    if (
      !Number.isInteger(limitPerSource)
      || limitPerSource < MIN_LIMIT_PER_SOURCE
      || limitPerSource > MAX_LIMIT_PER_SOURCE
    ) {
      throw new LatestContentValidationError(
        LATEST_CONTENT_VALIDATION_ERROR_CODE.INVALID_LIMIT_PER_SOURCE,
        'limitPerSource must be an integer between 1 and 50.',
      );
    }

    request.sources.forEach((source) => this.validateSource(source));

    return {
      sources: request.sources,
      limitPerSource,
    };
  }

  private validateSource(source: ILatestContentSourceRequest): void {
    if (!LATEST_CONTENT_SOURCE_KIND_ARRAY.includes(source.kind)) {
      throw new LatestContentValidationError(
        LATEST_CONTENT_VALIDATION_ERROR_CODE.UNSUPPORTED_SOURCE_KIND,
        `Source kind "${source.kind}" is not supported.`,
      );
    }

    switch (source.kind) {
      case LATEST_CONTENT_SOURCE_KIND.REDDIT_COMMUNITY:
        this.validateRedditCommunity(source);

        return;
      case LATEST_CONTENT_SOURCE_KIND.HACKER_NEWS_QUERY:
        this.validateHackerNewsQuery(source);

        return;
      case LATEST_CONTENT_SOURCE_KIND.JOURNAL_API_QUERY:
        this.validateJournalApiQuery(source);

        return;
      case LATEST_CONTENT_SOURCE_KIND.JOURNAL_FEED:
        this.validateJournalFeed(source);

        return;
    }
  }

  private validateRedditCommunity(source: ILatestContentSourceRequest): void {
    if (!this.hasText(source.community)) {
      throw new LatestContentValidationError(
        LATEST_CONTENT_VALIDATION_ERROR_CODE.INVALID_SOURCE_REQUEST,
        'Reddit community sources require a community.',
      );
    }
    if (source.sort && !REDDIT_COMMUNITY_SORT_ARRAY.includes(source.sort)) {
      throw new LatestContentValidationError(
        LATEST_CONTENT_VALIDATION_ERROR_CODE.INVALID_SOURCE_REQUEST,
        `Reddit community sort "${source.sort}" is not supported.`,
      );
    }
  }

  private validateHackerNewsQuery(source: ILatestContentSourceRequest): void {
    if (!this.hasText(source.query)) {
      throw new LatestContentValidationError(
        LATEST_CONTENT_VALIDATION_ERROR_CODE.INVALID_SOURCE_REQUEST,
        'Hacker News sources require a query.',
      );
    }
  }

  private validateJournalApiQuery(source: ILatestContentSourceRequest): void {
    if (!source.provider) {
      throw new LatestContentValidationError(
        LATEST_CONTENT_VALIDATION_ERROR_CODE.INVALID_SOURCE_REQUEST,
        'Journal API sources require a provider.',
      );
    }
    if (!JOURNAL_API_PROVIDER_ARRAY.includes(source.provider)) {
      throw new LatestContentValidationError(
        LATEST_CONTENT_VALIDATION_ERROR_CODE.UNSUPPORTED_JOURNAL_API_PROVIDER,
        `Journal API provider "${source.provider}" is not supported.`,
      );
    }
    if (!this.hasText(source.query)) {
      throw new LatestContentValidationError(
        LATEST_CONTENT_VALIDATION_ERROR_CODE.INVALID_SOURCE_REQUEST,
        'Journal API sources require a query.',
      );
    }
    if (source.fromPublishedDate && Number.isNaN(Date.parse(source.fromPublishedDate))) {
      throw new LatestContentValidationError(
        LATEST_CONTENT_VALIDATION_ERROR_CODE.INVALID_SOURCE_REQUEST,
        'fromPublishedDate must be a valid date string.',
      );
    }
  }

  private validateJournalFeed(source: ILatestContentSourceRequest): void {
    if (!this.hasText(source.url)) {
      throw new LatestContentValidationError(
        LATEST_CONTENT_VALIDATION_ERROR_CODE.INVALID_SOURCE_REQUEST,
        'Journal feed sources require a URL.',
      );
    }

    try {
      new URL(source.url);
    } catch {
      throw new LatestContentValidationError(
        LATEST_CONTENT_VALIDATION_ERROR_CODE.INVALID_SOURCE_REQUEST,
        'Journal feed URL must be valid.',
      );
    }
  }

  private hasText(value: string | undefined): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }
}
