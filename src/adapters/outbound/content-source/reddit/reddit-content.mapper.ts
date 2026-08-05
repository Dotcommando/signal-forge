import { IContentItem } from '../../../../domain/content-item';
import { IRedditPostDto } from './reddit-post-dto.interface';

export interface IClock {
  (): Date;
}

const REDDIT_PROVIDER = 'reddit';
const REDDIT_BASE_URL = 'https://www.reddit.com';

export class RedditContentMapper {
  constructor(private readonly clock: IClock = () => new Date()) {}

  toContentItems(posts: IRedditPostDto[], fallbackCommunity: string): IContentItem[] {
    return posts.flatMap((post) => this.toContentItem(post, fallbackCommunity));
  }

  private toContentItem(
    post: IRedditPostDto,
    fallbackCommunity: string,
  ): IContentItem[] {
    const externalId = post.name ?? post.id;

    if (!externalId) {
      return [];
    }

    const community = post.subreddit ?? fallbackCommunity;
    const sourceUrl = this.toAbsoluteRedditUrl(post.permalink);
    const canonicalUrl = post.url ?? sourceUrl;

    return [
      {
        id: `${REDDIT_PROVIDER}:${externalId}`,
        source: {
          provider: REDDIT_PROVIDER,
          externalId,
          ...(sourceUrl ? { url: sourceUrl } : {}),
        },
        ...(post.title ? { title: post.title } : {}),
        ...(canonicalUrl ? { canonicalUrl } : {}),
        ...(post.author && post.author !== '[deleted]'
          ? {
              author: {
                username: post.author,
                profileUrl: `${REDDIT_BASE_URL}/user/${encodeURIComponent(post.author)}/`,
              },
            }
          : {}),
        channel: {
          externalId: community,
          name: `r/${community}`,
          url: `${REDDIT_BASE_URL}/r/${encodeURIComponent(community)}/`,
        },
        labels: [REDDIT_PROVIDER, community],
        metrics: {
          ...(post.score !== undefined ? { score: post.score } : {}),
          ...(post.numComments !== undefined ? { comments: post.numComments } : {}),
        },
        files: [],
        ...(post.createdUtc !== undefined
          ? { publishedAt: new Date(post.createdUtc * 1000) }
          : {}),
        retrievedAt: this.clock(),
      },
    ];
  }

  private toAbsoluteRedditUrl(permalink: string | undefined): string | undefined {
    return permalink ? new URL(permalink, REDDIT_BASE_URL).toString() : undefined;
  }
}
