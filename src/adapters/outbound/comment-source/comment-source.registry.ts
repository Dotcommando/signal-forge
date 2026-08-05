import { Injectable } from '@nestjs/common';

import { ILatestCommentSourceRequest } from '../../../app/comment/get-latest-comments-request.interface';
import { LatestCommentValidationError } from '../../../app/comment/latest-comment-validation-error';
import { LATEST_COMMENT_VALIDATION_ERROR_CODE } from '../../../app/comment/latest-comment-validation-error-code.enum';
import { ICommentSourcePort } from '../../../ports/outbound/comment-source/comment-source.port';

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
