import { Injectable } from '@nestjs/common';

import { IGetHealthResult } from './get-health-result.interface';

@Injectable()
export class GetHealthUseCase {
  execute(): IGetHealthResult {
    return { status: 'ok' };
  }
}
