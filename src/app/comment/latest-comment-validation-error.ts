import { LATEST_COMMENT_VALIDATION_ERROR_CODE } from './latest-comment-validation-error-code.enum';

export class LatestCommentValidationError extends Error {
  constructor(
    public readonly code: LATEST_COMMENT_VALIDATION_ERROR_CODE,
    message: string,
  ) {
    super(message);
  }
}
