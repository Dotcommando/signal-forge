import { Injectable } from '@nestjs/common';

import {
  COMMENT_SORT_DIRECTION,
  COMMENT_SORT_DIRECTION_ARRAY,
} from '../types/comment-sort-direction.enum';
import {
  COMMENT_SORT_FIELD,
  COMMENT_SORT_FIELD_ARRAY,
} from '../types/comment-sort-field.enum';
import {
  COMMENT_SOURCE_KIND,
  COMMENT_SOURCE_KIND_ARRAY,
} from '../types/comment-source-kind.enum';
import { CommentValidationError } from '../types/comment-validation-error';
import { COMMENT_VALIDATION_ERROR_CODE } from '../types/comment-validation-error-code.enum';
import {
  ICommentFiltersRequest,
  ICommentSortRequest,
  ICommentSourceRequest,
  IGetCommentsRequest,
  IValidatedCommentFilters,
  IValidatedCommentSort,
  IValidatedCommentsRequest,
} from '../types/get-comments-request.interface';

const DEFAULT_LIMIT = 50;
const MIN_LIMIT = 1;
const MAX_LIMIT = 200;
const MIN_DEPTH = 0;
const MAX_DEPTH = 100;
const MIN_SCORE_PERCENTILE = 0;
const MAX_SCORE_PERCENTILE = 100;

@Injectable()
export class CommentRequestValidator {
  validate(request: IGetCommentsRequest): IValidatedCommentsRequest {
    this.validateSource(request.source);

    const filters = this.validateFilters(request.filters);

    return {
      source: request.source,
      filters,
      sort: this.validateSort(request.sort),
      limit: this.validateLimit(request.limit),
    };
  }

  private validateSource(source: ICommentSourceRequest): void {
    if (!COMMENT_SOURCE_KIND_ARRAY.includes(source.kind)) {
      throw new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.UNSUPPORTED_SOURCE_KIND,
        `Source kind "${source.kind}" is not supported.`,
      );
    }
    if (!this.hasText(source.externalId) && !this.hasText(source.url)) {
      throw new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.INVALID_SOURCE_REFERENCE,
        'Comment sources require an externalId or url.',
      );
    }
    if (this.hasText(source.url)) {
      this.validateUrl(source.url);
    }

    switch (source.kind) {
      case COMMENT_SOURCE_KIND.REDDIT_COMMUNITY:
      case COMMENT_SOURCE_KIND.HACKER_NEWS_QUERY:
        return;
    }
  }

  private validateFilters(
    filters: ICommentFiltersRequest = {},
  ): IValidatedCommentFilters {
    const minDepth = this.validateOptionalDepth(filters.minDepth, 'minDepth');
    const maxDepth = this.validateOptionalDepth(filters.maxDepth, 'maxDepth');

    if (
      minDepth !== undefined
      && maxDepth !== undefined
      && minDepth > maxDepth
    ) {
      throw new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.INVALID_DEPTH_RANGE,
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
      throw new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.INVALID_PUBLISHED_RANGE,
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
    sort: ICommentSortRequest = {},
  ): IValidatedCommentSort {
    const by = sort.by ?? COMMENT_SORT_FIELD.SCORE;
    const direction = sort.direction ?? COMMENT_SORT_DIRECTION.DESC;

    if (!COMMENT_SORT_FIELD_ARRAY.includes(by)) {
      throw new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.INVALID_SORT,
        `Comment sort field "${by}" is not supported.`,
      );
    }
    if (!COMMENT_SORT_DIRECTION_ARRAY.includes(direction)) {
      throw new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.INVALID_SORT,
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
      throw new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.INVALID_LIMIT,
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
      throw new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.INVALID_DEPTH_RANGE,
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
      throw new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.INVALID_PUBLISHED_RANGE,
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
      throw new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.INVALID_SCORE_PERCENTILE,
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
      throw new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.INVALID_SCORE_PERCENTILE,
        `${fieldName} must be a finite number.`,
      );
    }

    return value;
  }

  private validateUrl(value: string): void {
    try {
      new URL(value);
    } catch {
      throw new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.INVALID_SOURCE_REFERENCE,
        'Comment source URL must be valid.',
      );
    }
  }

  private hasText(value: string | undefined): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }
}
