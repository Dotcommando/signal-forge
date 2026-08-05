import { Injectable } from '@nestjs/common';

import { IContentItem } from '../../../../domain/content-item';
import { IContentSourcePort } from '../../../../ports/outbound/content-source/content-source.port';
import { LATEST_CONTENT_SOURCE_KIND } from '../../../../ports/outbound/content-source/latest-content-source-kind.enum';
import { ILatestContentSourceRequest } from '../../../../ports/outbound/content-source/latest-content-source-request.interface';
import { HackerNewsApiError } from './hacker-news-api-error';
import { HackerNewsContentMapper } from './hacker-news-content.mapper';
import { IHackerNewsStoryDto } from './hacker-news-story-dto.interface';

export interface IHackerNewsStoriesClient {
  searchLatestStories(request: {
    query: string;
    limit: number;
    fromPublishedDate?: string;
  }): Promise<IHackerNewsStoryDto[]>;
}

@Injectable()
export class HackerNewsContentSourceAdapter implements IContentSourcePort {
  constructor(
    private readonly apiClient: IHackerNewsStoriesClient,
    private readonly mapper: HackerNewsContentMapper,
  ) {}

  supports(source: ILatestContentSourceRequest): boolean {
    return source.kind === LATEST_CONTENT_SOURCE_KIND.HACKER_NEWS_QUERY;
  }

  async fetchLatestContentItems(
    source: ILatestContentSourceRequest,
    limitPerSource: number,
  ): Promise<IContentItem[]> {
    if (!source.query) {
      throw new HackerNewsApiError('Hacker News query is required.');
    }

    const stories = await this.apiClient.searchLatestStories({
      query: source.query,
      ...(source.fromPublishedDate
        ? { fromPublishedDate: source.fromPublishedDate }
        : {}),
      limit: limitPerSource,
    });

    return this.mapper.toContentItems(stories).slice(0, limitPerSource);
  }
}
