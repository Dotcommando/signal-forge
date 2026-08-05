import { Injectable } from '@nestjs/common';

import { IComment } from '../../../domain/comment';

@Injectable()
export class CommentScorePercentileFilter {
  apply(
    comments: IComment[],
    scorePercentile: number | undefined,
    minScore: number | undefined = undefined,
  ): IComment[] {
    const scoreFilteredComments = minScore === undefined
      ? comments
      : this.filterByMinimumScore(comments, minScore);

    if (scorePercentile === undefined) {
      return scoreFilteredComments;
    }

    const commentsWithScores = scoreFilteredComments.filter(
      (comment) => comment.metrics.score !== undefined,
    );

    if (commentsWithScores.length === 0) {
      return [];
    }

    const threshold = this.getPercentileThreshold(
      commentsWithScores.flatMap((comment) =>
        comment.metrics.score === undefined ? [] : [comment.metrics.score],
      ),
      scorePercentile,
    );

    return commentsWithScores.filter(
      (comment) => this.hasScoreAtLeast(comment, threshold),
    );
  }

  private filterByMinimumScore(comments: IComment[], minScore: number): IComment[] {
    return comments.filter((comment) => this.hasScoreAtLeast(comment, minScore));
  }

  private getPercentileThreshold(
    scores: number[],
    scorePercentile: number,
  ): number {
    const sortedScores = [...scores].sort((left, right) => left - right);
    const rawIndex = Math.ceil((scorePercentile / 100) * sortedScores.length) - 1;
    const index = Math.min(Math.max(rawIndex, 0), sortedScores.length - 1);

    return sortedScores[index];
  }

  private hasScoreAtLeast(comment: IComment, threshold: number): boolean {
    return comment.metrics.score !== undefined
      && comment.metrics.score >= threshold;
  }
}
