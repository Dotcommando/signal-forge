import { Injectable } from '@nestjs/common';

import {
  IGetLatestCommentsRequest,
  ILatestCommentFiltersRequest,
  ILatestCommentSortRequest,
  ILatestCommentSourceRequest,
  IValidatedLatestCommentFilters,
  IValidatedLatestCommentSort,
  IValidatedLatestCommentsRequest,
} from './get-latest-comments-request.interface';
import {
  LATEST_COMMENT_SORT_DIRECTION,
  LATEST_COMMENT_SORT_DIRECTION_ARRAY,
} from './latest-comment-sort-direction.enum';
import {
  LATEST_COMMENT_SORT_FIELD,
  LATEST_COMMENT_SORT_FIELD_ARRAY,
} from './latest-comment-sort-field.enum';
import {
  LATEST_COMMENT_SOURCE_KIND,
  LATEST_COMMENT_SOURCE_KIND_ARRAY,
} from './latest-comment-source-kind.enum';
import { LatestCommentValidationError } from './latest-comment-validation-error';
import { LATEST_COMMENT_VALIDATION_ERROR_CODE } from './latest-comment-validation-error-code.enum';

const DEFAULT_LIMIT = 50;
const MIN_LIMIT = 1;
const MAX_LIMIT = 200;
const MIN_DEPTH = 0;
const MAX_DEPTH = 100;
const MIN_SCORE_PERCENTILE = 0;
const MAX_SCORE_PERCENTILE = 100;

@Injectable()
export class LatestCommentRequestValidator {
  validate(request: IGetLatestCommentsRequest): IValidatedLatestCommentsRequest {
    this.validateSource(request.source);

    const filters = this.validateFilters(request.filters);

    return {
      source: request.source,
      filters,
      sort: this.validateSort(request.sort),
      limit: this.validateLimit(request.limit),
    };
  }

  private validateSource(source: ILatestCommentSourceRequest): void {
    if (!LATEST_COMMENT_SOURCE_KIND_ARRAY.includes(source.kind)) {
      throw new LatestCommentValidationError(
        LATEST_COMMENT_VALIDATION_ERROR_CODE.UNSUPPORTED_SOURCE_KIND,
        `Source kind "${source.kind}" is not supported.`,
      );
    }
    if (!this.hasText(source.externalId) && !this.hasText(source.url)) {
      throw new LatestCommentValidationError(
        LATEST_COMMENT_VALIDATION_ERROR_CODE.INVALID_SOURCE_REFERENCE,
        'Comment sources require an externalId or url.',
      );
    }
    if (this.hasText(source.url)) {
      this.validateUrl(source.url);
    }

    switch (source.kind) {
      case LATEST_COMMENT_SOURCE_KIND.REDDIT_COMMUNITY:
      case LATEST_COMMENT_SOURCE_KIND.HACKER_NEWS_QUERY:
        return;
    }
  }

  private validateFilters(
    filters: ILatestCommentFiltersRequest = {},
  ): IValidatedLatestCommentFilters {
    const minDepth = this.validateOptionalDepth(filters.minDepth, 'minDepth');
    const maxDepth = this.validateOptionalDepth(filters.maxDepth, 'maxDepth');

    if (
      minDepth !== undefined
      && maxDepth !== undefined
      && minDepth > maxDepth
    ) {
      throw new LatestCommentValidationError(
        LATEST_COMMENT_VALIDATION_ERROR_CODE.INVALID_DEPTH_RANGE,
        'minDepth must be less than or equal to maxDepth.',
      );
    }

    const publishedFrom = this.validateOptionalDate(filters.publishedFrom, 'publishedFrom');
    const publishedTo = this.validateOptionalDate(filters.publishedTo, 'publishedTo');

    if (
      publishedFrom !== undefined
      && publishedTo !== undefined
      && publishedFrom.getTime() > publishedTo.getTime()
    ) {
      throw new LatestCommentValidationError(
        LATEST_COMMENT_VALIDATION_ERROR_CODE.INVALID_PUBLISHED_RANGE,
        'publishedFrom must be before or equal to publishedTo.',
      );
    }

    const scorePercentile = this.validateOptionalScorePercentile(
      filters.scorePercentile,
    );
    const minScore = this.validateOptionalNumber(filters.minScore, 'minScore');

    return {
      ...(minDepth !== undefined ? { minDepth } : {}),
      ...(maxDepth !== undefined ? { maxDepth } : {}),
      ...(publishedFrom !== undefined ? { publishedFrom } : {}),
      ...(publishedTo !== undefined ? { publishedTo } : {}),
      ...(scorePercentile !== undefined ? { scorePercentile } : {}),
      ...(minScore !== undefined ? { minScore } : {}),
      includeUnavailable: filters.includeUnavailable ?? false,
    };
  }

  private validateSort(
    sort: ILatestCommentSortRequest = {},
  ): IValidatedLatestCommentSort {
    const by = sort.by ?? LATEST_COMMENT_SORT_FIELD.SCORE;
    const direction = sort.direction ?? LATEST_COMMENT_SORT_DIRECTION.DESC;

    if (!LATEST_COMMENT_SORT_FIELD_ARRAY.includes(by)) {
      throw new LatestCommentValidationError(
        LATEST_COMMENT_VALIDATION_ERROR_CODE.INVALID_SORT,
        `Comment sort field "${by}" is not supported.`,
      );
    }
    if (!LATEST_COMMENT_SORT_DIRECTION_ARRAY.includes(direction)) {
      throw new LatestCommentValidationError(
        LATEST_COMMENT_VALIDATION_ERROR_CODE.INVALID_SORT,
        `Comment sort direction "${direction}" is not supported.`,
      );
    }

    return { by, direction };
  }

  private validateLimit(limit = DEFAULT_LIMIT): number {
    if (
      !Number.isInteger(limit)
      || limit < MIN_LIMIT
      || limit > MAX_LIMIT
    ) {
      throw new LatestCommentValidationError(
        LATEST_COMMENT_VALIDATION_ERROR_CODE.INVALID_LIMIT,
        'limit must be an integer between 1 and 200.',
      );
    }

    return limit;
  }

  private validateOptionalDepth(
    value: number | null | undefined,
    fieldName: string,
  ): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (
      !Number.isInteger(value)
      || value < MIN_DEPTH
      || value > MAX_DEPTH
    ) {
      throw new LatestCommentValidationError(
        LATEST_COMMENT_VALIDATION_ERROR_CODE.INVALID_DEPTH_RANGE,
        `${fieldName} must be an integer between 0 and 100.`,
      );
    }

    return value;
  }

  private validateOptionalDate(
    value: string | null | undefined,
    fieldName: string,
  ): Date | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    const timestamp = Date.parse(value);

    if (Number.isNaN(timestamp)) {
      throw new LatestCommentValidationError(
        LATEST_COMMENT_VALIDATION_ERROR_CODE.INVALID_PUBLISHED_RANGE,
        `${fieldName} must be a valid date string.`,
      );
    }

    return new Date(timestamp);
  }

  private validateOptionalScorePercentile(
    value: number | null | undefined,
  ): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (
      !Number.isFinite(value)
      || value < MIN_SCORE_PERCENTILE
      || value > MAX_SCORE_PERCENTILE
    ) {
      throw new LatestCommentValidationError(
        LATEST_COMMENT_VALIDATION_ERROR_CODE.INVALID_SCORE_PERCENTILE,
        'scorePercentile must be between 0 and 100.',
      );
    }

    return value;
  }

  private validateOptionalNumber(
    value: number | null | undefined,
    fieldName: string,
  ): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (!Number.isFinite(value)) {
      throw new LatestCommentValidationError(
        LATEST_COMMENT_VALIDATION_ERROR_CODE.INVALID_SCORE_PERCENTILE,
        `${fieldName} must be a finite number.`,
      );
    }

    return value;
  }

  private validateUrl(value: string): void {
    try {
      new URL(value);
    } catch {
      throw new LatestCommentValidationError(
        LATEST_COMMENT_VALIDATION_ERROR_CODE.INVALID_SOURCE_REFERENCE,
        'Comment source URL must be valid.',
      );
    }
  }

  private hasText(value: string | undefined): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }
}
