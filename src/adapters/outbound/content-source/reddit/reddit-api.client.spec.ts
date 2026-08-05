import { REDDIT_COMMUNITY_SORT } from '../../../../app/content-item/reddit-community-sort.enum';
import { RedditApiClient } from './reddit-api.client';
import { RedditApiError } from './reddit-api-error';

describe('RedditApiClient', () => {
  it('fetches latest community posts through Reddit OAuth API', async () => {
    const fetchRequest = jest
      .fn<Promise<Response>, [string | URL, RequestInit?]>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: 'access-token',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              children: [
                {
                  kind: 't3',
                  data: {
                    id: 'abc123',
                    name: 't3_abc123',
                    title: 'Example post',
                    permalink: '/r/psychology/comments/abc123/example_post/',
                    url: 'https://example.com/article',
                    author: 'researcher',
                    subreddit: 'psychology',
                    score: 42,
                    num_comments: 7,
                    created_utc: 1783931400,
                  },
                },
              ],
            },
          }),
          { status: 200 },
        ),
      );
    const client = new RedditApiClient(
      {
        clientId: 'client-id',
        clientSecret: 'secret',
        userAgent: 'signal-forge/0.1.0',
      },
      fetchRequest,
    );

    await expect(
      client.getLatestCommunityPosts({
        community: 'psychology',
        sort: REDDIT_COMMUNITY_SORT.NEW,
        limit: 10,
      }),
    ).resolves.toEqual([
      {
        id: 'abc123',
        name: 't3_abc123',
        title: 'Example post',
        permalink: '/r/psychology/comments/abc123/example_post/',
        url: 'https://example.com/article',
        author: 'researcher',
        subreddit: 'psychology',
        score: 42,
        numComments: 7,
        createdUtc: 1783931400,
      },
    ]);
    expect(fetchRequest).toHaveBeenCalledTimes(2);
    expect(fetchRequest.mock.calls[1]?.[0].toString()).toBe(
      'https://oauth.reddit.com/r/psychology/new.json?limit=10',
    );
  });

  it('maps malformed Reddit responses to adapter errors', async () => {
    const fetchRequest = jest
      .fn<Promise<Response>, [string | URL, RequestInit?]>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: 'access-token',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {},
          }),
          { status: 200 },
        ),
      );
    const client = new RedditApiClient(
      {
        clientId: 'client-id',
        clientSecret: 'secret',
        userAgent: 'signal-forge/0.1.0',
      },
      fetchRequest,
    );

    await expect(
      client.getLatestCommunityPosts({
        community: 'psychology',
        sort: REDDIT_COMMUNITY_SORT.NEW,
        limit: 10,
      }),
    ).rejects.toThrow(new RedditApiError('Reddit listing response is malformed.'));
  });
});
