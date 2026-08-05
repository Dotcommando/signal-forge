import { Injectable } from '@nestjs/common';

import { IContentSourcePort } from '../../../ports/outbound/content-source/content-source.port';
import { ILatestContentSourceRequest } from '../../../ports/outbound/content-source/latest-content-source-request.interface';
import { LatestContentValidationError } from '../types/latest-content-validation-error';
import { LATEST_CONTENT_VALIDATION_ERROR_CODE } from '../types/latest-content-validation-error-code.enum';

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
