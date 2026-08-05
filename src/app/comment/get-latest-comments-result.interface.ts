import { IComment } from '../../domain/comment';
import { LATEST_COMMENT_ERROR_CODE } from './latest-comment-error-code.enum';

export interface ILatestCommentSourceError {
  code: LATEST_COMMENT_ERROR_CODE;
  message: string;
}

export interface ILatestCommentsMeta {
  retrievedAt: Date;
  totalFetched: number;
  totalMatched: number;
  returned: number;
  truncated: boolean;
}

export interface IGetLatestCommentsResult {
  comments: IComment[];
  meta: ILatestCommentsMeta;
  errors: ILatestCommentSourceError[];
}
