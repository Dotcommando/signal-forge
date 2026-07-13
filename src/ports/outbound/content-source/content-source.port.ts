import { ILatestContentSourceRequest } from '../../../app/content-item/get-latest-content-items-request.interface';
import { IContentItem } from '../../../domain/content-item';

export interface IContentSourcePort {
  supports(source: ILatestContentSourceRequest): boolean;
  fetchLatestContentItems(
    source: ILatestContentSourceRequest,
    limitPerSource: number,
  ): Promise<IContentItem[]>;
}
