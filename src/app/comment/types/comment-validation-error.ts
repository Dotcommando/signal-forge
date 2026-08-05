import { COMMENT_VALIDATION_ERROR_CODE } from '../types/comment-validation-error-code.enum';

export class CommentValidationError extends Error {
  constructor(
    public readonly code: COMMENT_VALIDATION_ERROR_CODE,
    message: string,
  ) {
    super(message);
  }
}
