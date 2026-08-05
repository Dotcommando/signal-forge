import { Injectable } from '@nestjs/common';

import { ICommentSourcePort } from '../../ports/outbound/comment-source/comment-source.port';
import { ILatestCommentSourceRequest } from '../../ports/outbound/comment-source/latest-comment-source-request.interface';
import { LatestCommentValidationError } from './latest-comment-validation-error';
import { LATEST_COMMENT_VALIDATION_ERROR_CODE } from './latest-comment-validation-error-code.enum';

@Injectable()
export class CommentSourceRegistry {
  constructor(private readonly adapters: ICommentSourcePort[] = []) {}

  get(source: ILatestCommentSourceRequest): ICommentSourcePort {
    const adapter = this.adapters.find((candidate) => candidate.supports(source));

    if (!adapter) {
      throw new LatestCommentValidationError(
        LATEST_COMMENT_VALIDATION_ERROR_CODE.UNSUPPORTED_SOURCE_KIND,
        `No comment source adapter supports "${source.kind}".`,
      );
    }

    return adapter;
  }
}
