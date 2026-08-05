import { ILatestContentSourceRequest } from '../../../ports/outbound/content-source/latest-content-source-request.interface';

export type { ILatestContentSourceRequest } from '../../../ports/outbound/content-source/latest-content-source-request.interface';

export interface IGetLatestContentItemsRequest {
  sources: ILatestContentSourceRequest[];
  limitPerSource?: number;
}

export interface IValidatedLatestContentItemsRequest {
  sources: ILatestContentSourceRequest[];
  limitPerSource: number;
}
