import { IContentItem } from '../../../domain/content-item';
import { ILatestContentSourceRequest } from './latest-content-source-request.interface';

export interface IContentSourcePort {
  supports(source: ILatestContentSourceRequest): boolean;
  fetchLatestContentItems(
    source: ILatestContentSourceRequest,
    limitPerSource: number,
  ): Promise<IContentItem[]>;
}
