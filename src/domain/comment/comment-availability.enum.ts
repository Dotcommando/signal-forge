export enum COMMENT_AVAILABILITY {
  AVAILABLE = 'available',
  DELETED = 'deleted',
  REMOVED = 'removed',
  UNAVAILABLE = 'unavailable',
}

export const COMMENT_AVAILABILITY_ARRAY = Object.values(
  COMMENT_AVAILABILITY,
);
