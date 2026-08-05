import { IContentItem } from '../../../../domain/content-item';
import { IHackerNewsStoryDto } from './hacker-news-story-dto.interface';

export interface IHackerNewsClock {
  (): Date;
}

const HACKER_NEWS_PROVIDER = 'hacker-news';
const HACKER_NEWS_BASE_URL = 'https://news.ycombinator.com/';

export class HackerNewsContentMapper {
  constructor(private readonly clock: IHackerNewsClock = () => new Date()) {}

  toContentItems(stories: IHackerNewsStoryDto[]): IContentItem[] {
    return stories.flatMap((story) => this.toContentItem(story));
  }

  private toContentItem(story: IHackerNewsStoryDto): IContentItem[] {
    if (!story.objectId) {
      return [];
    }

    const sourceUrl = this.getStoryUrl(story.objectId);
    const canonicalUrl = story.url ?? sourceUrl;
    const publishedAt = this.getPublishedAt(story);

    return [
      {
        id: `${HACKER_NEWS_PROVIDER}:${story.objectId}`,
        source: {
          provider: HACKER_NEWS_PROVIDER,
          externalId: story.objectId,
          url: sourceUrl,
        },
        ...(story.title ? { title: story.title } : {}),
        canonicalUrl,
        ...(story.storyText ? { html: story.storyText } : {}),
        ...(story.author
          ? {
              author: {
                username: story.author,
                profileUrl: `${HACKER_NEWS_BASE_URL}user?id=${encodeURIComponent(story.author)}`,
              },
            }
          : {}),
        channel: {
          externalId: HACKER_NEWS_PROVIDER,
          name: 'Hacker News',
          url: HACKER_NEWS_BASE_URL,
        },
        labels: [HACKER_NEWS_PROVIDER],
        metrics: {
          ...(story.points !== undefined ? { score: story.points } : {}),
          ...(story.numComments !== undefined ? { comments: story.numComments } : {}),
        },
        files: [],
        ...(publishedAt ? { publishedAt } : {}),
        retrievedAt: this.clock(),
      },
    ];
  }

  private getStoryUrl(objectId: string): string {
    const url = new URL('item', HACKER_NEWS_BASE_URL);

    url.searchParams.set('id', objectId);

    return url.toString();
  }

  private getPublishedAt(story: IHackerNewsStoryDto): Date | undefined {
    if (story.createdAt) {
      const timestamp = Date.parse(story.createdAt);

      return Number.isNaN(timestamp) ? undefined : new Date(timestamp);
    }

    return story.createdAtTimestamp
      ? new Date(story.createdAtTimestamp * 1000)
      : undefined;
  }
}
