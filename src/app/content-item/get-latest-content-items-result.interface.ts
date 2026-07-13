import { IContentItem } from '../../domain/content-item';
import { LATEST_CONTENT_ERROR_CODE } from './latest-content-error-code.enum';

export interface ILatestContentSourceError {
  sourceIndex: number;
  code: LATEST_CONTENT_ERROR_CODE;
  message: string;
}

export interface IGetLatestContentItemsResult {
  items: IContentItem[];
  errors: ILatestContentSourceError[];
}
