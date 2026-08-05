import { LATEST_COMMENT_SOURCE_KIND } from './latest-comment-source-kind.enum';

export interface ILatestCommentSourceRequest {
  kind: LATEST_COMMENT_SOURCE_KIND;
  externalId?: string;
  url?: string;
}
