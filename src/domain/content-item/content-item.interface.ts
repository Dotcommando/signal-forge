import { IFileReference } from '../file';
import { IAuthorReference, IContentChannel, ISourceReference } from '../shared';

export interface IContentMetrics {
  score?: number;
  upvotes?: number;
  downvotes?: number;
  comments?: number;
  views?: number;
  shares?: number;
}

export interface IContentItem {
  id: string;
  source: ISourceReference;
  title?: string;
  text?: string;
  html?: string;
  canonicalUrl?: string;
  language?: string;
  author?: IAuthorReference;
  channel?: IContentChannel;
  labels: string[];
  metrics: IContentMetrics;
  files: IFileReference[];
  publishedAt?: Date;
  sourceUpdatedAt?: Date;
  retrievedAt: Date;
}
