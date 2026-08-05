import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import type { IGetLatestContentItemsRequest } from '../../../../app/content-item/types/get-latest-content-items-request.interface';
import type { IGetLatestContentItemsResult } from '../../../../app/content-item/types/get-latest-content-items-result.interface';
import { LatestContentValidationError } from '../../../../app/content-item/types/latest-content-validation-error';
import { GetLatestContentItemsUseCase } from '../../../../app/content-item/use-cases/get-latest-content-items.use-case';

@Controller('content-items')
export class LatestContentController {
  constructor(
    private readonly getLatestContentItemsUseCase: GetLatestContentItemsUseCase,
  ) {}

  @Post('latest')
  @HttpCode(HttpStatus.OK)
  async getLatestContentItems(
    @Body() request: IGetLatestContentItemsRequest,
  ): Promise<IGetLatestContentItemsResult> {
    try {
      return await this.getLatestContentItemsUseCase.execute(request);
    } catch (error) {
      if (error instanceof LatestContentValidationError) {
        throw new BadRequestException({
          code: error.code,
          message: error.message,
        });
      }

      throw error;
    }
  }
}
