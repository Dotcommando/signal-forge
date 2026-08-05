import { COMMENT_SORT_DIRECTION } from './comment-sort-direction.enum';
import { COMMENT_SORT_FIELD } from './comment-sort-field.enum';
import { ICommentSourceRequest } from './comment-source-request.interface';

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
  by: COMMENT_SORT_FIELD;
  direction: COMMENT_SORT_DIRECTION;
}

export interface ICommentSourceFetchRequest {
  source: ICommentSourceRequest;
  filters: ICommentSourceFetchFilters;
  sort: ICommentSourceFetchSort;
  limit: number;
}
