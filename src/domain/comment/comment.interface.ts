import { IFileReference } from '../file';
import { IAuthorReference, ISourceReference } from '../shared';
import { COMMENT_AVAILABILITY } from './comment-availability.enum';

export interface ICommentMetrics {
  score?: number;
  upvotes?: number;
  downvotes?: number;
  replies?: number;
}

export interface IComment {
  id: string;
  contentItemId: string;
  source: ISourceReference;
  parentCommentId?: string;
  rootCommentId: string;
  depth: number;
  path: string[];
  text?: string;
  html?: string;
  availability: COMMENT_AVAILABILITY;
  author?: IAuthorReference;
  metrics: ICommentMetrics;
  files: IFileReference[];
  publishedAt?: Date;
  sourceUpdatedAt?: Date;
  retrievedAt: Date;
}
