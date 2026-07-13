import { Injectable } from '@nestjs/common';

import { ILatestContentSourceRequest } from '../../../app/content-item/get-latest-content-items-request.interface';
import { LatestContentValidationError } from '../../../app/content-item/latest-content-validation-error';
import { LATEST_CONTENT_VALIDATION_ERROR_CODE } from '../../../app/content-item/latest-content-validation-error-code.enum';
import { IContentSourcePort } from '../../../ports/outbound/content-source/content-source.port';

@Injectable()
export class ContentSourceRegistry {
  constructor(private readonly adapters: IContentSourcePort[] = []) {}

  get(source: ILatestContentSourceRequest): IContentSourcePort {
    const adapter = this.adapters.find((candidate) => candidate.supports(source));

    if (!adapter) {
      throw new LatestContentValidationError(
        LATEST_CONTENT_VALIDATION_ERROR_CODE.UNSUPPORTED_SOURCE_KIND,
        `No content source adapter supports "${source.kind}".`,
      );
    }

    return adapter;
  }
}
