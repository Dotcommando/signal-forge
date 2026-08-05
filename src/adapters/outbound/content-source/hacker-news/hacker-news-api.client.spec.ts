import { HackerNewsApiClient } from './hacker-news-api.client';
import { HackerNewsApiError } from './hacker-news-api-error';

describe('HackerNewsApiClient', () => {
  it('fetches latest stories from HN Algolia with query and date filters', async () => {
    const fetchRequest = jest
      .fn<Promise<Response>, [string | URL, RequestInit?]>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            hits: [
              {
                objectID: '123',
                title: 'Psychology in software teams',
                url: 'https://example.com/psychology',
                author: 'hn_user',
                points: 33,
                num_comments: 12,
                created_at: '2026-08-05T10:00:00.000Z',
                created_at_i: 1785924000,
              },
            ],
          }),
          { status: 200 },
        ),
      );
    const client = new HackerNewsApiClient(fetchRequest);

    await expect(
      client.searchLatestStories({
        query: 'psychology',
        fromPublishedDate: '2026-08-01',
        limit: 10,
      }),
    ).resolves.toEqual([
      {
        objectId: '123',
        title: 'Psychology in software teams',
        url: 'https://example.com/psychology',
        author: 'hn_user',
        points: 33,
        numComments: 12,
        createdAt: '2026-08-05T10:00:00.000Z',
        createdAtTimestamp: 1785924000,
      },
    ]);
    expect(fetchRequest).toHaveBeenCalledTimes(1);
    expect(fetchRequest.mock.calls[0]?.[0].toString()).toBe(
      'https://hn.algolia.com/api/v1/search_by_date?query=psychology&tags=story&hitsPerPage=10&numericFilters=created_at_i%3E%3D1785542400',
    );
  });

  it('maps malformed HN responses to adapter errors', async () => {
    const fetchRequest = jest
      .fn<Promise<Response>, [string | URL, RequestInit?]>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            hits: {},
          }),
          { status: 200 },
        ),
      );
    const client = new HackerNewsApiClient(fetchRequest);

    await expect(
      client.searchLatestStories({
        query: 'psychology',
        limit: 10,
      }),
    ).rejects.toThrow(new HackerNewsApiError('HN Algolia response is malformed.'));
  });
});
