import { REDDIT_COMMUNITY_SORT } from '../../../../ports/outbound/content-source/reddit-community-sort.enum';
import { RedditApiError } from './reddit-api-error';
import { IRedditPostDto } from './reddit-post-dto.interface';

export interface IRedditApiClientConfig {
  clientId: string;
  clientSecret: string;
  userAgent: string;
}

export interface IRedditCommunityPostsRequest {
  community: string;
  sort: REDDIT_COMMUNITY_SORT;
  limit: number;
}

export interface IRedditFetch {
  (url: string | URL, init?: RequestInit): Promise<Response>;
}

const REDDIT_ACCESS_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
const REDDIT_OAUTH_BASE_URL = 'https://oauth.reddit.com';

export class RedditApiClient {
  constructor(
    private readonly config: IRedditApiClientConfig,
    private readonly fetchRequest: IRedditFetch = fetch,
  ) {}

  async getLatestCommunityPosts(
    request: IRedditCommunityPostsRequest,
  ): Promise<IRedditPostDto[]> {
    this.ensureConfigured();

    const accessToken = await this.getAccessToken();
    const url = new URL(
      `/r/${encodeURIComponent(request.community)}/${request.sort}.json`,
      REDDIT_OAUTH_BASE_URL,
    );

    url.searchParams.set('limit', request.limit.toString());

    const response = await this.fetchRequest(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': this.config.userAgent,
      },
    });

    if (!response.ok) {
      throw new RedditApiError(`Reddit listing request failed with ${response.status}.`);
    }

    return this.parseListingResponse(await response.json());
  }

  private async getAccessToken(): Promise<string> {
    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`,
    ).toString('base64');
    const response = await this.fetchRequest(REDDIT_ACCESS_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': this.config.userAgent,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      throw new RedditApiError(`Reddit authentication failed with ${response.status}.`);
    }

    const body = await response.json();

    if (!this.isRecord(body) || typeof body.access_token !== 'string') {
      throw new RedditApiError('Reddit authentication response is malformed.');
    }

    return body.access_token;
  }

  private parseListingResponse(response: unknown): IRedditPostDto[] {
    if (!this.isRecord(response) || !this.isRecord(response.data)) {
      throw new RedditApiError('Reddit listing response is malformed.');
    }

    const children = response.data.children;

    if (!Array.isArray(children)) {
      throw new RedditApiError('Reddit listing response is malformed.');
    }

    return children.flatMap((child) => this.parsePostChild(child));
  }

  private parsePostChild(child: unknown): IRedditPostDto[] {
    if (!this.isRecord(child) || child.kind !== 't3' || !this.isRecord(child.data)) {
      return [];
    }

    const post = child.data;

    return [
      {
        id: this.readString(post.id),
        name: this.readString(post.name),
        title: this.readString(post.title),
        permalink: this.readString(post.permalink),
        url: this.readString(post.url),
        author: this.readString(post.author),
        subreddit: this.readString(post.subreddit),
        score: this.readNumber(post.score),
        numComments: this.readNumber(post.num_comments),
        createdUtc: this.readNumber(post.created_utc),
      },
    ];
  }

  private ensureConfigured(): void {
    if (
      this.config.clientId.trim().length === 0
      || this.config.clientSecret.trim().length === 0
      || this.config.userAgent.trim().length === 0
    ) {
      throw new RedditApiError('Reddit OAuth configuration is incomplete.');
    }
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
