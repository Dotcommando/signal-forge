import { RedditContentMapper } from './reddit-content.mapper';
import { IRedditPostDto } from './reddit-post-dto.interface';

describe('RedditContentMapper', () => {
  it('normalizes latest subreddit posts from fixtures', () => {
    const mapper = new RedditContentMapper(
      () => new Date('2026-07-13T09:00:00.000Z'),
    );

    expect(mapper.toContentItems([createPost()], 'psychology')).toEqual([
      {
        id: 'reddit:t3_abc123',
        source: {
          provider: 'reddit',
          externalId: 't3_abc123',
          url: 'https://www.reddit.com/r/psychology/comments/abc123/example_post/',
        },
        title: 'Example post',
        canonicalUrl: 'https://example.com/article',
        author: {
          username: 'researcher',
          profileUrl: 'https://www.reddit.com/user/researcher/',
        },
        channel: {
          externalId: 'psychology',
          name: 'r/psychology',
          url: 'https://www.reddit.com/r/psychology/',
        },
        labels: ['reddit', 'psychology'],
        metrics: {
          score: 42,
          comments: 7,
        },
        files: [],
        publishedAt: new Date('2026-07-13T08:30:00.000Z'),
        retrievedAt: new Date('2026-07-13T09:00:00.000Z'),
      },
    ]);
  });

  it('handles missing optional fields', () => {
    const mapper = new RedditContentMapper(
      () => new Date('2026-07-13T09:00:00.000Z'),
    );

    expect(
      mapper.toContentItems(
        [
          {
            id: 'abc123',
          },
        ],
        'psychology',
      ),
    ).toEqual([
      {
        id: 'reddit:abc123',
        source: {
          provider: 'reddit',
          externalId: 'abc123',
        },
        channel: {
          externalId: 'psychology',
          name: 'r/psychology',
          url: 'https://www.reddit.com/r/psychology/',
        },
        labels: ['reddit', 'psychology'],
        metrics: {},
        files: [],
        retrievedAt: new Date('2026-07-13T09:00:00.000Z'),
      },
    ]);
  });

  it('skips malformed posts without a usable identifier', () => {
    const mapper = new RedditContentMapper();

    expect(mapper.toContentItems([{ title: 'Missing identifier' }], 'psychology')).toEqual([]);
  });
});

function createPost(): IRedditPostDto {
  return {
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
  };
}
