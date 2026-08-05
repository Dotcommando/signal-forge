export interface IRedditPostDto {
  id?: string;
  name?: string;
  title?: string;
  permalink?: string;
  url?: string;
  author?: string;
  subreddit?: string;
  score?: number;
  numComments?: number;
  createdUtc?: number;
}
