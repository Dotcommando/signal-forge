import { COMMENT_SORT_DIRECTION } from '../../../ports/outbound/comment-source/comment-sort-direction.enum';
import { COMMENT_SORT_FIELD } from '../../../ports/outbound/comment-source/comment-sort-field.enum';
import { ICommentSourceRequest } from '../../../ports/outbound/comment-source/comment-source-request.interface';

export type { ICommentSourceRequest } from '../../../ports/outbound/comment-source/comment-source-request.interface';

export interface ICommentFiltersRequest {
  minDepth?: number | null;
  maxDepth?: number | null;
  publishedFrom?: string | null;
  publishedTo?: string | null;
  scorePercentile?: number | null;
  minScore?: number | null;
  includeUnavailable?: boolean | null;
}

export interface ICommentSortRequest {
  by?: COMMENT_SORT_FIELD;
  direction?: COMMENT_SORT_DIRECTION;
}

export interface IGetCommentsRequest {
  source: ICommentSourceRequest;
  filters?: ICommentFiltersRequest;
  sort?: ICommentSortRequest;
  limit?: number;
}

export interface IValidatedCommentFilters {
  minDepth?: number;
  maxDepth?: number;
  publishedFrom?: Date;
  publishedTo?: Date;
  scorePercentile?: number;
  minScore?: number;
  includeUnavailable: boolean;
}

export interface IValidatedCommentSort {
  by: COMMENT_SORT_FIELD;
  direction: COMMENT_SORT_DIRECTION;
}

export interface IValidatedCommentsRequest {
  source: ICommentSourceRequest;
  filters: IValidatedCommentFilters;
  sort: IValidatedCommentSort;
  limit: number;
}
