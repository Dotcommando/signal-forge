import { IComment } from '../../../domain/comment';
import { COMMENT_ERROR_CODE } from '../types/comment-error-code.enum';

export interface ICommentSourceError {
  code: COMMENT_ERROR_CODE;
  message: string;
}

export interface ICommentsMeta {
  retrievedAt: Date;
  totalFetched: number;
  totalMatched: number;
  returned: number;
  truncated: boolean;
}

export interface IGetCommentsResult {
  comments: IComment[];
  meta: ICommentsMeta;
  errors: ICommentSourceError[];
}
