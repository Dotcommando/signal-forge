import { IComment } from '../../../domain/comment';
import { ICommentSourceFetchRequest } from './comment-source-fetch-request.interface';
import { ILatestCommentSourceRequest } from './latest-comment-source-request.interface';

export interface ICommentSourcePort {
  supports(source: ILatestCommentSourceRequest): boolean;
  fetchLatestComments(
    request: ICommentSourceFetchRequest,
  ): Promise<IComment[]>;
}
