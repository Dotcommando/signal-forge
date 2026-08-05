import { COMMENT_AVAILABILITY, IComment } from '../../domain/comment';
import { CommentScorePercentileFilter } from './comment-score-percentile-filter';

describe('CommentScorePercentileFilter', () => {
  let filter: CommentScorePercentileFilter;

  beforeEach(() => {
    filter = new CommentScorePercentileFilter();
  });

  it('returns all comments when score filters are not requested', () => {
    const comments = [
      createComment('comment-1', 10),
      createComment('comment-2', undefined),
    ];

    expect(filter.apply(comments, undefined)).toEqual(comments);
  });

  it('uses a deterministic nearest-rank threshold for odd inputs', () => {
    expect(
      filter.apply(
        [
          createComment('comment-1', 10),
          createComment('comment-2', 30),
          createComment('comment-3', 20),
        ],
        50,
      ).map((comment) => comment.id),
    ).toEqual(['comment-2', 'comment-3']);
  });

  it('uses a deterministic nearest-rank threshold for even inputs', () => {
    expect(
      filter.apply(
        [
          createComment('comment-1', 10),
          createComment('comment-2', 40),
          createComment('comment-3', 20),
          createComment('comment-4', 30),
        ],
        50,
      ).map((comment) => comment.id),
    ).toEqual(['comment-2', 'comment-3', 'comment-4']);
  });

  it('returns an empty list for empty percentile inputs', () => {
    expect(filter.apply([], 80)).toEqual([]);
  });

  it('includes tied comments at the percentile threshold', () => {
    expect(
      filter.apply(
        [
          createComment('comment-1', 10),
          createComment('comment-2', 20),
          createComment('comment-3', 20),
          createComment('comment-4', 30),
        ],
        75,
      ).map((comment) => comment.id),
    ).toEqual(['comment-2', 'comment-3', 'comment-4']);
  });

  it('excludes comments without score metrics when score filters are requested', () => {
    expect(
      filter.apply(
        [
          createComment('comment-1', undefined),
          createComment('comment-2', 5),
        ],
        undefined,
        1,
      ),
    ).toEqual([createComment('comment-2', 5)]);
  });

  it('applies minimum score before percentile thresholding', () => {
    expect(
      filter.apply(
        [
          createComment('comment-1', 1),
          createComment('comment-2', 5),
          createComment('comment-3', 10),
        ],
        50,
        5,
      ).map((comment) => comment.id),
    ).toEqual(['comment-2', 'comment-3']);
  });
});

function createComment(id: string, score: number | undefined): IComment {
  return {
    id,
    contentItemId: 'reddit:t3_abc123',
    source: {
      provider: 'reddit',
      externalId: id,
    },
    rootCommentId: id,
    depth: 0,
    path: [id],
    availability: COMMENT_AVAILABILITY.AVAILABLE,
    metrics: {
      ...(score !== undefined ? { score } : {}),
    },
    files: [],
    retrievedAt: new Date('2026-08-05T10:05:00.000Z'),
  };
}
