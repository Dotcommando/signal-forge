import { IValidatedLatestCommentsRequest } from '../../../app/comment/get-latest-comments-request.interface';
import { IComment } from '../../../domain/comment';

export interface ICommentSourcePort {
  supports(source: IValidatedLatestCommentsRequest['source']): boolean;
  fetchLatestComments(
    request: IValidatedLatestCommentsRequest,
  ): Promise<IComment[]>;
}
