import { Injectable } from '@nestjs/common';

import { ContentSourceRegistry } from '../../adapters/outbound/content-source/content-source.registry';
import { IContentItem } from '../../domain/content-item';
import { IGetLatestContentItemsRequest } from './get-latest-content-items-request.interface';
import { IGetLatestContentItemsResult, ILatestContentSourceError } from './get-latest-content-items-result.interface';
import { LATEST_CONTENT_ERROR_CODE } from './latest-content-error-code.enum';
import { LatestContentRequestValidator } from './latest-content-request-validator';
import { LatestContentValidationError } from './latest-content-validation-error';
import { LATEST_CONTENT_VALIDATION_ERROR_CODE } from './latest-content-validation-error-code.enum';

@Injectable()
export class GetLatestContentItemsUseCase {
  constructor(
    private readonly validator: LatestContentRequestValidator,
    private readonly contentSourceRegistry: ContentSourceRegistry,
  ) {}

  async execute(
    request: IGetLatestContentItemsRequest,
  ): Promise<IGetLatestContentItemsResult> {
    const validatedRequest = this.validator.validate(request);
    const items: IContentItem[] = [];
    const errors: ILatestContentSourceError[] = [];

    for (const [sourceIndex, source] of validatedRequest.sources.entries()) {
      try {
        const adapter = this.contentSourceRegistry.get(source);
        const sourceItems = await adapter.fetchLatestContentItems(
          source,
          validatedRequest.limitPerSource,
        );

        items.push(...sourceItems);
      } catch (error) {
        errors.push({
          sourceIndex,
          code: this.getErrorCode(error),
          message: this.getErrorMessage(error),
        });
      }
    }

    return { items, errors };
  }

  private getErrorCode(error: unknown): LATEST_CONTENT_ERROR_CODE {
    if (error instanceof LatestContentValidationError) {
      return error.code === LATEST_CONTENT_VALIDATION_ERROR_CODE.UNSUPPORTED_SOURCE_KIND
        ? LATEST_CONTENT_ERROR_CODE.SOURCE_UNSUPPORTED
        : LATEST_CONTENT_ERROR_CODE.SOURCE_REQUEST_INVALID;
    }

    return LATEST_CONTENT_ERROR_CODE.SOURCE_TEMPORARILY_UNAVAILABLE;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Source request failed.';
  }
}
