export enum COMMENT_SOURCE_KIND {
  REDDIT_COMMUNITY = 'reddit-community',
  HACKER_NEWS_QUERY = 'hacker-news-query',
}

export const COMMENT_SOURCE_KIND_ARRAY = Object.values(
  COMMENT_SOURCE_KIND,
);
