import { JOURNAL_API_PROVIDER } from './journal-api-provider.enum';
import { LATEST_CONTENT_SOURCE_KIND } from './latest-content-source-kind.enum';
import { REDDIT_COMMUNITY_SORT } from './reddit-community-sort.enum';

export interface ILatestContentSourceRequest {
  kind: LATEST_CONTENT_SOURCE_KIND;
  community?: string;
  query?: string;
  provider?: JOURNAL_API_PROVIDER;
  url?: string;
  sort?: REDDIT_COMMUNITY_SORT;
  fromPublishedDate?: string;
}

export interface IGetLatestContentItemsRequest {
  sources: ILatestContentSourceRequest[];
  limitPerSource?: number;
}

export interface IValidatedLatestContentItemsRequest {
  sources: ILatestContentSourceRequest[];
  limitPerSource: number;
}
