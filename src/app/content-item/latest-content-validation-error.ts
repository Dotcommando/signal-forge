import { LATEST_CONTENT_VALIDATION_ERROR_CODE } from './latest-content-validation-error-code.enum';

export class LatestContentValidationError extends Error {
  constructor(
    public readonly code: LATEST_CONTENT_VALIDATION_ERROR_CODE,
    message: string,
  ) {
    super(message);
  }
}
