# COMMENTS.md

## Purpose

This document defines the current comments implementation plan for
`signal-forge`.

Architecture and coding rules are defined in `AGENTS.md`.

## Current Scope

Implement on-demand flat comment retrieval for the existing Reddit and Hacker
News source phase.

Current source policy:

```txt
reddit
  - Fetch comments from Reddit for a supplied Reddit content reference.
  - Normalize nested provider comments into a flat list.
  - Support percentile filtering by normalized comment score/upvotes.

hacker-news
  - Keep Hacker News as a latest-content source.
  - Depth and publication-date filters must work when HN comments are fetched.
  - Return an explicit unsupported-capability error when score-based filters are
    requested, unless a legal HN API path with per-comment score/upvote metrics
    is selected.
```

Do not add journal, RSS, Crossref, Europe PMC, NCBI, DOAJ, or other source
adapters in this plan.

The comments response is flat. Do not reconstruct branches in this phase.

## Query Policy

All comment sources must support:

```txt
minDepth
maxDepth
publishedFrom
publishedTo
limit
```

`publishedFrom` and `publishedTo` are optional. Either side of the date range may
be open.

Score-based filters:

```txt
scorePercentile
minScore
```

are allowed only for sources that expose per-comment score/upvote metrics.
Reddit supports these filters. Hacker News must return an explicit
unsupported-capability error when either score filter is requested.

Do not add `offset` in this phase. Live external comments can change between
requests, and offset pagination would produce unstable pages unless the service
stores a snapshot or cursor state. The current goal is fast retrieval of
interesting data, so the endpoint returns one bounded, ranked response.

Default response policy:

```txt
limit
  - default: 50
  - maximum: 200
sort.by
  - default: score when score metrics are available
  - fallback: publishedAt
sort.direction
  - default: desc
includeUnavailable
  - default: false
```

The response must include metadata so MCP callers can understand truncation:

```txt
retrievedAt
totalFetched
totalMatched
returned
truncated
```

## Endpoint

```txt
POST /comments/latest
```

Request shape:

```json
{
  "source": {
    "kind": "reddit-community",
    "externalId": "t3_abc123",
    "url": "https://www.reddit.com/r/psychology/comments/abc123/example/"
  },
  "filters": {
    "minDepth": 0,
    "maxDepth": 5,
    "publishedFrom": null,
    "publishedTo": null,
    "scorePercentile": 80,
    "minScore": 5,
    "includeUnavailable": false
  },
  "sort": {
    "by": "score",
    "direction": "desc"
  },
  "limit": 50
}
```

Response shape:

```json
{
  "comments": [
    {
      "id": "reddit:t1_comment1",
      "source": {
        "provider": "reddit",
        "externalId": "t1_comment1",
        "url": "https://www.reddit.com/r/psychology/comments/abc123/example/comment1/"
      },
      "contentItemExternalId": "t3_abc123",
      "parentExternalId": "t3_abc123",
      "depth": 0,
      "path": ["t1_comment1"],
      "text": "Example comment",
      "author": {
        "username": "example_user"
      },
      "metrics": {
        "score": 42,
        "upvotes": 42,
        "downvotes": 0
      },
      "availability": "available",
      "publishedAt": "2026-08-05T10:00:00.000Z",
      "retrievedAt": "2026-08-05T10:05:00.000Z"
    }
  ],
  "meta": {
    "retrievedAt": "2026-08-05T10:05:00.000Z",
    "totalFetched": 438,
    "totalMatched": 72,
    "returned": 50,
    "truncated": true
  },
  "errors": []
}
```

Hacker News score-filter error shape:

```json
{
  "code": "COMMENT_SCORE_FILTER_UNSUPPORTED",
  "message": "Score percentile filtering is not available for Hacker News comments."
}
```

HTTP mapping:

```txt
400
  - syntactically invalid request;
  - invalid bounds such as negative depth or limit above maximum.
422
  - request is syntactically valid, but the requested filter is unsupported by
    the selected source.
```

## Lagent Reuse Audit

Reviewed `/Users/alphared/Projects/lagent/provider-reddit`.

Useful concepts to reuse:

- `src/types/comment.interface.ts`
  - good Reddit field inventory: `redditId`, `articleRedditId`,
    `parentRedditId`, `replies`, `score`, `ups`, `downs`, `depth`,
    `isSubmitter`, `distinguished`, `gilded`, `stickied`, `locked`,
    `archived`, `removed`, `controversiality`, `retrievalDate`;
  - adapt these into provider-independent `IComment` fields already present in
    `src/domain/comment/comment.interface.ts` instead of copying Reddit-specific
    names into the app/domain layer.
- `src/utils/reddit-comment-data-to-comment.mapper.ts`
  - reuse the mapping decisions conceptually: `created_utc` to `Date`,
    numeric `edited` to `Date`, `body` to text, `author_fullname` fallback,
    `score`/`ups`/`downs`, moderation flags;
  - keep the mapper inside
    `src/adapters/outbound/content-source/reddit`.
- `src/services/comments.service.ts`
  - reuse the recursive flattening idea from Reddit listings;
  - preserve parent id and depth;
  - do not reuse its branch-expansion filter behavior because this phase must
    return flat percentile-filtered comments only.
- `src/services/reddit.service.ts`
  - reuse the API shape idea: `comments/{articleRedditId}` with `depth` and
    `limit`;
  - keep using the current `signal-forge` fetch-based Reddit client style rather
    than copying Axios/interceptors.
- `src/schemas/comments.schema.ts`
  - useful later for MongoDB indexes and persistence fields;
  - do not introduce persistence in this plan.

Do not copy lagent code directly. Some lagent implementation details conflict
with current `AGENTS.md` rules, including provider DTO leakage into shared types,
Mongoose coupling, and TypeScript assertions.

## Step 1. Flat Comment Contract And Percentile Filter

### Clarity Check

Small, clear, and testable. No provider API calls.

### Red

- empty or invalid source references are rejected;
- unsupported source kinds are rejected before adapter execution;
- `scorePercentile` is bounded from 0 to 100;
- `limit` is bounded;
- `minDepth` and `maxDepth` are bounded and may be open;
- `publishedFrom` and `publishedTo` are valid optional date range ends;
- percentile threshold is deterministic for odd, even, empty, and tied inputs;
- comments without score metrics are excluded or reported according to request
  policy.

### Green

- define provider-independent comments request and response interfaces;
- define comment error codes as enums;
- define sort field and sort direction enums;
- define `CommentSourcePort.fetchLatestComments()`;
- add `CommentSourceRegistry`;
- implement `LatestCommentRequestValidator`;
- implement `CommentScorePercentileFilter` for flat comments.

### Verify

- validation and percentile tests pass;
- build, lint, and tests pass.

### Progress

- [x] Completed.

Implemented provider-independent comments request/result contracts, comment
error and validation enums, sort enums, `CommentSourcePort`,
`CommentSourceRegistry`, `LatestCommentRequestValidator`, and
`CommentScorePercentileFilter`.

Verification completed:

- validation and percentile unit tests pass;
- full build, lint, and test suite pass.

## Step 2. Reddit Flat Comments Adapter

### Clarity Check

Small enough if limited to Reddit API comments, DTO parsing, flattening, and
mapping. No REST controller in this step.

Use the Step 1 `IValidatedLatestCommentsRequest`, `ICommentSourcePort`, and
`LATEST_COMMENT_SOURCE_KIND.REDDIT_COMMUNITY` contracts. Keep depth, limit, and
source reference parsing inside the Reddit outbound adapter boundary.

### Red

- nested Reddit comment fixtures are flattened;
- parent external id and depth are preserved;
- `score`, `ups`, and `downs` are preserved;
- deleted and removed comments map to `COMMENT_AVAILABILITY`;
- missing optional text and author fields are handled;
- `depth` and `limit` are applied to the Reddit API request;
- API/auth failures surface for application-level error mapping;
- provider DTOs do not leave the Reddit outbound adapter.

### Green

- add `RedditApiClient.getComments()`;
- add Reddit comment DTO interfaces inside the Reddit adapter folder;
- add `RedditCommentMapper.toFlatComments()`;
- add `RedditCommentSourceAdapter` implementing `CommentSourcePort`;
- register the Reddit comment adapter in `CommentSourceRegistry`.

### Verify

- fixture tests do not require live Reddit API;
- build, lint, and tests pass.

### Progress

- [ ] Not started.

## Step 3. Comments REST Endpoint And Postman Collection

### Clarity Check

Clear and testable after Steps 1 and 2. This step wires the application flow and
updates the endpoint artifact required by `AGENTS.md`.

Use the Step 1 validator, percentile filter, registry, response metadata shape,
and error enums. Keep score-filter capability checks in the use-case/controller
mapping path so Hacker News can return the explicit 422 unsupported-capability
response.

### Red

- `POST /comments/latest` delegates to the comments use case;
- Reddit comments are returned flat after percentile filtering;
- depth and publication-date filters work for every implemented comment source;
- Hacker News score-filter requests return `COMMENT_SCORE_FILTER_UNSUPPORTED`;
- invalid requests map to stable HTTP 400 responses;
- unsupported source/filter capability maps to HTTP 422;
- response metadata reports fetched, matched, returned, and truncated counts;
- `postman/signal-forge.postman_collection.json` contains `POST /comments/latest`.

### Green

- implement `GetLatestCommentsUseCase`;
- implement `LatestCommentController`;
- wire validator, percentile filter, and comment registry in `AppModule`;
- add Hacker News unsupported-capability behavior for comments;
- do not add offset pagination;
- update the Postman collection.

### Verify

- endpoint tests pass for Reddit success, invalid request, and HN unsupported
  capability;
- build, lint, and tests pass.

### Progress

- [ ] Not started.

## Step 4. Reassess Next Phase

After flat comment retrieval is implemented and verified, decide whether the
next phase should add persistence, branch reconstruction, source configuration,
MCP exposure, or scheduled discovery.

No change yet. Reassess after Step 3 proves the endpoint behavior and Postman
artifact.

### Progress

- [ ] Not started.
