import { LATEST_CONTENT_SOURCE_KIND } from '../../../../ports/outbound/content-source/latest-content-source-kind.enum';
import { REDDIT_COMMUNITY_SORT } from '../../../../ports/outbound/content-source/reddit-community-sort.enum';
import { RedditApiClient } from './reddit-api.client';
import { RedditApiError } from './reddit-api-error';
import { RedditContentMapper } from './reddit-content.mapper';
import { RedditContentSourceAdapter } from './reddit-content-source.adapter';

describe('RedditContentSourceAdapter', () => {
  it('implements the content source port for Reddit community sources', async () => {
    const apiClient = new RedditApiClient(
      {
        clientId: 'client-id',
        clientSecret: 'secret',
        userAgent: 'signal-forge/0.1.0',
      },
      async () =>
        new Response(
          JSON.stringify({
            access_token: 'access-token',
          }),
        ),
    );
    const adapter = new RedditContentSourceAdapter(
      apiClient,
      new RedditContentMapper(() => new Date('2026-07-13T09:00:00.000Z')),
    );

    expect(
      adapter.supports({
        kind: LATEST_CONTENT_SOURCE_KIND.REDDIT_COMMUNITY,
        community: 'psychology',
      }),
    ).toBe(true);
  });

  it('bounds returned items by the requested limit', async () => {
    const apiClient = {
      getLatestCommunityPosts: jest.fn().mockResolvedValue([
        { id: 'one' },
        { id: 'two' },
      ]),
    };
    const adapter = new RedditContentSourceAdapter(
      apiClient,
      new RedditContentMapper(() => new Date('2026-07-13T09:00:00.000Z')),
    );

    await expect(
      adapter.fetchLatestContentItems(
        {
          kind: LATEST_CONTENT_SOURCE_KIND.REDDIT_COMMUNITY,
          community: 'psychology',
          sort: REDDIT_COMMUNITY_SORT.NEW,
        },
        1,
      ),
    ).resolves.toHaveLength(1);
  });

  it('surfaces API failures for application-level partial error mapping', async () => {
    const apiClient = {
      getLatestCommunityPosts: jest
        .fn()
        .mockRejectedValue(new RedditApiError('Reddit authentication failed with 401.')),
    };
    const adapter = new RedditContentSourceAdapter(
      apiClient,
      new RedditContentMapper(),
    );

    await expect(
      adapter.fetchLatestContentItems(
        {
          kind: LATEST_CONTENT_SOURCE_KIND.REDDIT_COMMUNITY,
          community: 'psychology',
        },
        10,
      ),
    ).rejects.toThrow(
      new RedditApiError('Reddit authentication failed with 401.'),
    );
  });
});
