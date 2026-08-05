import { LATEST_CONTENT_SOURCE_KIND } from '../../../../ports/outbound/content-source/latest-content-source-kind.enum';
import { HackerNewsApiError } from './hacker-news-api-error';
import { HackerNewsContentMapper } from './hacker-news-content.mapper';
import { HackerNewsContentSourceAdapter } from './hacker-news-content-source.adapter';

describe('HackerNewsContentSourceAdapter', () => {
  it('implements the content source port for Hacker News query sources', () => {
    const apiClient = {
      searchLatestStories: jest.fn().mockResolvedValue([]),
    };
    const adapter = new HackerNewsContentSourceAdapter(
      apiClient,
      new HackerNewsContentMapper(),
    );

    expect(
      adapter.supports({
        kind: LATEST_CONTENT_SOURCE_KIND.HACKER_NEWS_QUERY,
        query: 'psychology',
      }),
    ).toBe(true);
  });

  it('bounds returned items by the requested limit', async () => {
    const apiClient = {
      searchLatestStories: jest.fn().mockResolvedValue([
        { objectId: 'one' },
        { objectId: 'two' },
      ]),
    };
    const adapter = new HackerNewsContentSourceAdapter(
      apiClient,
      new HackerNewsContentMapper(() => new Date('2026-08-05T11:00:00.000Z')),
    );

    await expect(
      adapter.fetchLatestContentItems(
        {
          kind: LATEST_CONTENT_SOURCE_KIND.HACKER_NEWS_QUERY,
          query: 'psychology',
          fromPublishedDate: '2026-08-01',
        },
        1,
      ),
    ).resolves.toHaveLength(1);
    expect(apiClient.searchLatestStories).toHaveBeenCalledWith({
      query: 'psychology',
      fromPublishedDate: '2026-08-01',
      limit: 1,
    });
  });

  it('surfaces API failures for application-level partial error mapping', async () => {
    const apiClient = {
      searchLatestStories: jest
        .fn()
        .mockRejectedValue(new HackerNewsApiError('HN Algolia request failed with 503.')),
    };
    const adapter = new HackerNewsContentSourceAdapter(
      apiClient,
      new HackerNewsContentMapper(),
    );

    await expect(
      adapter.fetchLatestContentItems(
        {
          kind: LATEST_CONTENT_SOURCE_KIND.HACKER_NEWS_QUERY,
          query: 'psychology',
        },
        10,
      ),
    ).rejects.toThrow(
      new HackerNewsApiError('HN Algolia request failed with 503.'),
    );
  });
});
