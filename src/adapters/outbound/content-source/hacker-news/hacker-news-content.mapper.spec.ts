import { HackerNewsContentMapper } from './hacker-news-content.mapper';
import { IHackerNewsStoryDto } from './hacker-news-story-dto.interface';

describe('HackerNewsContentMapper', () => {
  it('normalizes HN Algolia story results from fixtures', () => {
    const mapper = new HackerNewsContentMapper(
      () => new Date('2026-08-05T11:00:00.000Z'),
    );

    expect(mapper.toContentItems([createStory()])).toEqual([
      {
        id: 'hacker-news:123',
        source: {
          provider: 'hacker-news',
          externalId: '123',
          url: 'https://news.ycombinator.com/item?id=123',
        },
        title: 'Psychology in software teams',
        canonicalUrl: 'https://example.com/psychology',
        author: {
          username: 'hn_user',
          profileUrl: 'https://news.ycombinator.com/user?id=hn_user',
        },
        channel: {
          externalId: 'hacker-news',
          name: 'Hacker News',
          url: 'https://news.ycombinator.com/',
        },
        labels: ['hacker-news'],
        metrics: {
          score: 33,
          comments: 12,
        },
        files: [],
        publishedAt: new Date('2026-08-05T10:00:00.000Z'),
        retrievedAt: new Date('2026-08-05T11:00:00.000Z'),
      },
    ]);
  });

  it('handles missing optional fields', () => {
    const mapper = new HackerNewsContentMapper(
      () => new Date('2026-08-05T11:00:00.000Z'),
    );

    expect(
      mapper.toContentItems([
        {
          objectId: '123',
        },
      ]),
    ).toEqual([
      {
        id: 'hacker-news:123',
        source: {
          provider: 'hacker-news',
          externalId: '123',
          url: 'https://news.ycombinator.com/item?id=123',
        },
        canonicalUrl: 'https://news.ycombinator.com/item?id=123',
        channel: {
          externalId: 'hacker-news',
          name: 'Hacker News',
          url: 'https://news.ycombinator.com/',
        },
        labels: ['hacker-news'],
        metrics: {},
        files: [],
        retrievedAt: new Date('2026-08-05T11:00:00.000Z'),
      },
    ]);
  });

  it('skips malformed stories without a usable identifier', () => {
    const mapper = new HackerNewsContentMapper();

    expect(mapper.toContentItems([{ title: 'Missing identifier' }])).toEqual([]);
  });
});

function createStory(): IHackerNewsStoryDto {
  return {
    objectId: '123',
    title: 'Psychology in software teams',
    url: 'https://example.com/psychology',
    author: 'hn_user',
    points: 33,
    numComments: 12,
    createdAt: '2026-08-05T10:00:00.000Z',
    createdAtTimestamp: 1785924000,
  };
}
