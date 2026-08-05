import { COMMENT_SOURCE_KIND } from './comment-source-kind.enum';

export interface ICommentSourceRequest {
  kind: COMMENT_SOURCE_KIND;
  externalId?: string;
  url?: string;
}
