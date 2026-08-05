export enum LATEST_CONTENT_SOURCE_KIND {
  REDDIT_COMMUNITY = 'reddit-community',
  HACKER_NEWS_QUERY = 'hacker-news-query',
  JOURNAL_API_QUERY = 'journal-api-query',
  JOURNAL_FEED = 'journal-feed',
}

export const LATEST_CONTENT_SOURCE_KIND_ARRAY = Object.values(
  LATEST_CONTENT_SOURCE_KIND,
);
