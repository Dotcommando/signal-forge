import { LATEST_COMMENT_SORT_DIRECTION } from './latest-comment-sort-direction.enum';
import { LATEST_COMMENT_SORT_FIELD } from './latest-comment-sort-field.enum';
import { ILatestCommentSourceRequest } from './latest-comment-source-request.interface';

export interface ICommentSourceFetchFilters {
  minDepth?: number;
  maxDepth?: number;
  publishedFrom?: Date;
  publishedTo?: Date;
  scorePercentile?: number;
  minScore?: number;
  includeUnavailable: boolean;
}

export interface ICommentSourceFetchSort {
  by: LATEST_COMMENT_SORT_FIELD;
  direction: LATEST_COMMENT_SORT_DIRECTION;
}

export interface ICommentSourceFetchRequest {
  source: ILatestCommentSourceRequest;
  filters: ICommentSourceFetchFilters;
  sort: ICommentSourceFetchSort;
  limit: number;
}
