import { HackerNewsApiError } from './hacker-news-api-error';
import { IHackerNewsStoryDto } from './hacker-news-story-dto.interface';

export interface IHackerNewsStoriesRequest {
  query: string;
  limit: number;
  fromPublishedDate?: string;
}

export interface IHackerNewsFetch {
  (url: string | URL, init?: RequestInit): Promise<Response>;
}

const HACKER_NEWS_SEARCH_URL =
  'https://hn.algolia.com/api/v1/search_by_date';

export class HackerNewsApiClient {
  constructor(private readonly fetchRequest: IHackerNewsFetch = fetch) {}

  async searchLatestStories(
    request: IHackerNewsStoriesRequest,
  ): Promise<IHackerNewsStoryDto[]> {
    const url = new URL(HACKER_NEWS_SEARCH_URL);

    url.searchParams.set('query', request.query);
    url.searchParams.set('tags', 'story');
    url.searchParams.set('hitsPerPage', request.limit.toString());

    if (request.fromPublishedDate) {
      url.searchParams.set(
        'numericFilters',
        `created_at_i>=${this.toUnixTimestamp(request.fromPublishedDate)}`,
      );
    }

    const response = await this.fetchRequest(url);

    if (!response.ok) {
      throw new HackerNewsApiError(
        `HN Algolia request failed with ${response.status}.`,
      );
    }

    return this.parseSearchResponse(await response.json());
  }

  private parseSearchResponse(response: unknown): IHackerNewsStoryDto[] {
    if (!this.isRecord(response) || !Array.isArray(response.hits)) {
      throw new HackerNewsApiError('HN Algolia response is malformed.');
    }

    return response.hits.flatMap((hit) => this.parseStory(hit));
  }

  private parseStory(hit: unknown): IHackerNewsStoryDto[] {
    if (!this.isRecord(hit)) {
      return [];
    }

    return [
      {
        objectId: this.readString(hit.objectID),
        title: this.readString(hit.title),
        url: this.readString(hit.url),
        author: this.readString(hit.author),
        points: this.readNumber(hit.points),
        numComments: this.readNumber(hit.num_comments),
        createdAt: this.readString(hit.created_at),
        createdAtTimestamp: this.readNumber(hit.created_at_i),
        storyText: this.readString(hit.story_text),
      },
    ];
  }

  private toUnixTimestamp(date: string): number {
    return Math.floor(Date.parse(date) / 1000);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private readString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0
      ? value
      : undefined;
  }

  private readNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value)
      ? value
      : undefined;
  }
}
