import { LATEST_COMMENT_SORT_DIRECTION } from './latest-comment-sort-direction.enum';
import { LATEST_COMMENT_SORT_FIELD } from './latest-comment-sort-field.enum';
import { LATEST_COMMENT_SOURCE_KIND } from './latest-comment-source-kind.enum';

export interface ILatestCommentSourceRequest {
  kind: LATEST_COMMENT_SOURCE_KIND;
  externalId?: string;
  url?: string;
}

export interface ILatestCommentFiltersRequest {
  minDepth?: number | null;
  maxDepth?: number | null;
  publishedFrom?: string | null;
  publishedTo?: string | null;
  scorePercentile?: number | null;
  minScore?: number | null;
  includeUnavailable?: boolean | null;
}

export interface ILatestCommentSortRequest {
  by?: LATEST_COMMENT_SORT_FIELD;
  direction?: LATEST_COMMENT_SORT_DIRECTION;
}

export interface IGetLatestCommentsRequest {
  source: ILatestCommentSourceRequest;
  filters?: ILatestCommentFiltersRequest;
  sort?: ILatestCommentSortRequest;
  limit?: number;
}

export interface IValidatedLatestCommentFilters {
  minDepth?: number;
  maxDepth?: number;
  publishedFrom?: Date;
  publishedTo?: Date;
  scorePercentile?: number;
  minScore?: number;
  includeUnavailable: boolean;
}

export interface IValidatedLatestCommentSort {
  by: LATEST_COMMENT_SORT_FIELD;
  direction: LATEST_COMMENT_SORT_DIRECTION;
}

export interface IValidatedLatestCommentsRequest {
  source: ILatestCommentSourceRequest;
  filters: IValidatedLatestCommentFilters;
  sort: IValidatedLatestCommentSort;
  limit: number;
}
