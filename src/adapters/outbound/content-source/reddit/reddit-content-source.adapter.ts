import { Injectable } from '@nestjs/common';

import { IContentItem } from '../../../../domain/content-item';
import { IContentSourcePort } from '../../../../ports/outbound/content-source/content-source.port';
import { LATEST_CONTENT_SOURCE_KIND } from '../../../../ports/outbound/content-source/latest-content-source-kind.enum';
import { ILatestContentSourceRequest } from '../../../../ports/outbound/content-source/latest-content-source-request.interface';
import { REDDIT_COMMUNITY_SORT } from '../../../../ports/outbound/content-source/reddit-community-sort.enum';
import { RedditApiError } from './reddit-api-error';
import { RedditContentMapper } from './reddit-content.mapper';
import { IRedditPostDto } from './reddit-post-dto.interface';

export interface IRedditPostsClient {
  getLatestCommunityPosts(request: {
    community: string;
    sort: REDDIT_COMMUNITY_SORT;
    limit: number;
  }): Promise<IRedditPostDto[]>;
}

@Injectable()
export class RedditContentSourceAdapter implements IContentSourcePort {
  constructor(
    private readonly apiClient: IRedditPostsClient,
    private readonly mapper: RedditContentMapper,
  ) {}

  supports(source: ILatestContentSourceRequest): boolean {
    return source.kind === LATEST_CONTENT_SOURCE_KIND.REDDIT_COMMUNITY;
  }

  async fetchLatestContentItems(
    source: ILatestContentSourceRequest,
    limitPerSource: number,
  ): Promise<IContentItem[]> {
    if (!source.community) {
      throw new RedditApiError('Reddit community is required.');
    }

    const posts = await this.apiClient.getLatestCommunityPosts({
      community: source.community,
      sort: source.sort ?? REDDIT_COMMUNITY_SORT.NEW,
      limit: limitPerSource,
    });

    return this.mapper
      .toContentItems(posts, source.community)
      .slice(0, limitPerSource);
  }
}
