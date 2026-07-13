import { Test, TestingModule } from '@nestjs/testing';

import { GetLatestContentItemsUseCase } from '../../../../app/content-item/get-latest-content-items.use-case';
import { LATEST_CONTENT_SOURCE_KIND } from '../../../../app/content-item/latest-content-source-kind.enum';
import { LatestContentController } from './latest-content.controller';

describe('LatestContentController', () => {
  let controller: LatestContentController;
  let useCase: jest.Mocked<GetLatestContentItemsUseCase>;

  beforeEach(async () => {
    useCase = {
      execute: jest.fn().mockResolvedValue({
        items: [],
        errors: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LatestContentController],
      providers: [
        {
          provide: GetLatestContentItemsUseCase,
          useValue: useCase,
        },
      ],
    }).compile();

    controller = module.get<LatestContentController>(LatestContentController);
  });

  it('delegates latest-content requests to the use case', async () => {
    const request = {
      sources: [
        {
          kind: LATEST_CONTENT_SOURCE_KIND.HACKER_NEWS_QUERY,
          query: 'psychology',
        },
      ],
    };

    await expect(controller.getLatestContentItems(request)).resolves.toEqual({
      items: [],
      errors: [],
    });
    expect(useCase.execute).toHaveBeenCalledWith(request);
  });
});
