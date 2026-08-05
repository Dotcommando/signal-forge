import { IComment } from '../../../domain/comment';
import { ICommentSourceFetchRequest } from './comment-source-fetch-request.interface';
import { ICommentSourceRequest } from './comment-source-request.interface';

export interface ICommentSourcePort {
  supports(source: ICommentSourceRequest): boolean;
  fetchComments(
    request: ICommentSourceFetchRequest,
  ): Promise<IComment[]>;
}
