import { Injectable } from '@nestjs/common';

import { ICommentSourcePort } from '../../../ports/outbound/comment-source/comment-source.port';
import { ICommentSourceRequest } from '../../../ports/outbound/comment-source/comment-source-request.interface';
import { CommentValidationError } from '../types/comment-validation-error';
import { COMMENT_VALIDATION_ERROR_CODE } from '../types/comment-validation-error-code.enum';

@Injectable()
export class CommentSourceRegistry {
  constructor(private readonly adapters: ICommentSourcePort[] = []) {}

  get(source: ICommentSourceRequest): ICommentSourcePort {
    const adapter = this.adapters.find((candidate) => candidate.supports(source));

    if (!adapter) {
      throw new CommentValidationError(
        COMMENT_VALIDATION_ERROR_CODE.UNSUPPORTED_SOURCE_KIND,
        `No comment source adapter supports "${source.kind}".`,
      );
    }

    return adapter;
  }
}
