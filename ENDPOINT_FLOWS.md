# ENDPOINT_FLOWS.md

## Purpose

This document defines the near-term REST call flows for the current
`signal-forge` implementation phase.

Architecture and coding rules are defined in `AGENTS.md`.

## Current Phase Goal

Expose only the two endpoints needed at this stage:

```txt
GET  /health
POST /content-items/latest
```

`POST /content-items/latest` must fetch the latest articles or posts from a
request-defined set of communities or publication sources. It must not be
Reddit-specific. The same endpoint must support Reddit communities, Hacker News
queries, and legal article feeds or metadata APIs from Western psychology and
mental-health publications.

The endpoint fetches current external data on demand, normalizes it, and returns
bounded normalized items. Persistence, MCP tools, comment fetching, binary file
storage, percentile filtering, and scheduled discovery are outside this phase.

## Planning Progress

- [x] Current phase reduced to `GET /health` and `POST /content-items/latest`.
- [x] Latest-content endpoint replanned as provider-independent instead of
  Reddit-specific.
- [x] Next implementation steps split into Red/Green/Verify blocks.
- [x] Nested `AGENTS.md` files checked; only the root `AGENTS.md` exists, so no
  nested instruction update is needed.

## Legal Source Policy

Only use provider APIs, public metadata APIs, or publisher-provided feeds whose
terms allow programmatic retrieval for this use case. Do not scrape HTML pages.

Initial legal provider families:

```txt
reddit-community
  - Reddit OAuth API for subreddit listings/search.
hacker-news-query
  - Hacker News Algolia API for HN stories by query/tag/date.
journal-api-query
  - Scholarly metadata APIs such as Crossref REST, Europe PMC REST, NCBI
    E-utilities/PubMed, or DOAJ.
journal-feed
  - Publisher-provided RSS/Atom feeds when the publisher exposes them for
    syndication.
```

Implementation code must model these closed provider/source kinds as enums, not
inline string-literal unions.

## Planned REST Endpoints

### GET /health

Returns application health for the current phase.

For this phase the endpoint may report only application process health unless a
new dependency is introduced. If an external dependency is added during
implementation, health must include a meaningful dependency check for it.

### POST /content-items/latest

Fetches latest content from the sources supplied in the request body.

This is intentionally a `POST` because the source list can contain structured
provider-specific criteria, pagination limits, and API options.

Example request shape:

```json
{
  "sources": [
    {
      "kind": "reddit-community",
      "community": "psychology",
      "sort": "new"
    },
    {
      "kind": "hacker-news-query",
      "query": "psychology OR mental health"
    },
    {
      "kind": "journal-api-query",
      "provider": "crossref",
      "query": "clinical psychology",
      "fromPublishedDate": "2026-01-01"
    },
    {
      "kind": "journal-feed",
      "url": "https://example.publisher.local/rss"
    }
  ],
  "limitPerSource": 20
}
```

Example response shape:

```json
{
  "items": [
    {
      "source": {
        "kind": "reddit-community",
        "provider": "reddit",
        "community": "psychology",
        "externalId": "abc123",
        "url": "https://www.reddit.com/r/psychology/comments/abc123/example/"
      },
      "title": "Example title",
      "url": "https://example.com/article",
      "publishedAt": "2026-07-13T08:30:00.000Z",
      "authors": [],
      "channel": {
        "name": "r/psychology",
        "url": "https://www.reddit.com/r/psychology/"
      },
      "summary": null,
      "metrics": {
        "score": 12,
        "commentCount": 3
      },
      "labels": ["psychology"]
    }
  ],
  "errors": [
    {
      "sourceIndex": 2,
      "code": "SOURCE_TEMPORARILY_UNAVAILABLE",
      "message": "Crossref request timed out."
    }
  ]
}
```

Partial success is allowed: one failed source must not prevent valid results from
other sources from being returned.

---

# REST Call Flows

## GET /health

`src/adapters/inbound/http/controllers/health.controller.ts`:

```txt
getHealth
  - Calls GetHealthUseCase.execute()
```

`src/app/health/get-health.use-case.ts`:

```txt
execute
  - Returns process-level health for this phase.
  - Calls dependency health ports only for dependencies that exist in this phase.
```

## POST /content-items/latest

`src/adapters/inbound/http/controllers/latest-content.controller.ts`:

```txt
getLatestContentItems
  - Validates request DTO.
  - Calls GetLatestContentItemsUseCase.execute()
  - Maps application result to HTTP response.
```

`src/app/content-item/get-latest-content-items.use-case.ts`:

```txt
execute
  - Calls LatestContentRequestValidator.validate()
  - Calls ContentSourceRegistry.get() for each requested source.
  - Calls ContentSourcePort.fetchLatestContentItems() for each requested source.
  - Calls LatestContentResultMerger.merge()
```

`src/app/content-item/latest-content-request-validator.ts`:

```txt
validate
  - Rejects empty source lists.
  - Rejects unsupported provider/source kinds before adapter execution.
  - Rejects non-API/non-feed source definitions.
  - Applies a bounded limitPerSource.
```

`src/adapters/outbound/content-source/content-source.registry.ts`:

```txt
get
  - Selects an outbound adapter by source kind/provider.
```

`src/ports/outbound/content-source/content-source.port.ts`:

```txt
fetchLatestContentItems
  - Accepts provider-independent application request objects.
  - Returns normalized content items only.
  - Does not expose provider DTOs outside outbound adapters.
```

## Provider Adapter Flows

### Reddit community adapter

`src/adapters/outbound/content-source/reddit/reddit-content-source.adapter.ts`:

```txt
fetchLatestContentItems
  - Calls RedditApiClient.getLatestCommunityPosts()
  - Calls RedditContentMapper.toContentItems()
```

`src/adapters/outbound/content-source/reddit/reddit-api.client.ts`:

```txt
getLatestCommunityPosts
  - Calls Reddit OAuth API.
  - Uses configured authentication.
  - Applies limit and sort.
```

### Hacker News query adapter

`src/adapters/outbound/content-source/hacker-news/hacker-news-content-source.adapter.ts`:

```txt
fetchLatestContentItems
  - Calls HackerNewsApiClient.searchLatestStories()
  - Calls HackerNewsContentMapper.toContentItems()
```

`src/adapters/outbound/content-source/hacker-news/hacker-news-api.client.ts`:

```txt
searchLatestStories
  - Calls Hacker News Algolia API.
  - Applies query, tag/date filters, and limit.
```

### Journal API adapter

`src/adapters/outbound/content-source/journal-api/journal-api-content-source.adapter.ts`:

```txt
fetchLatestContentItems
  - Calls the configured legal metadata API client.
  - Calls JournalApiContentMapper.toContentItems()
```

Supported initial clients:

```txt
CrossrefApiClient
EuropePmcApiClient
NcbiEUtilitiesApiClient
DoajApiClient
```

Each client must keep provider DTOs inside the outbound adapter and return only
normalized application objects to the application layer.

### Journal feed adapter

`src/adapters/outbound/content-source/journal-feed/journal-feed-content-source.adapter.ts`:

```txt
fetchLatestContentItems
  - Calls FeedClient.getFeed()
  - Parses RSS or Atom with a structured parser.
  - Calls JournalFeedContentMapper.toContentItems()
```

The feed adapter is allowed only for publisher-provided RSS/Atom feeds. It must
not parse arbitrary HTML pages.

---

# Step Plan

## Step 1. Health endpoint

### Clarity Check

Small, clear, and testable.

### Red

- `GET /health` returns a stable HTTP response.
- the controller delegates to the application use case.

### Green

- add a thin HTTP health controller;
- add `GetHealthUseCase`;
- keep dependency checks process-only unless this phase introduces real
  dependencies.

### Verify

- unit or e2e health test passes;
- build, lint, and tests pass.

### Progress

- [x] Implemented `HealthController` at
  `src/adapters/inbound/http/controllers/health.controller.ts`.
- [x] Implemented `GetHealthUseCase` at
  `src/app/health/get-health.use-case.ts`.
- [x] Replaced the scaffold root endpoint with `GET /health`.
- [x] Added unit coverage for the use case and controller delegation.
- [x] Updated e2e coverage for `GET /health`.
- [x] Verified with unit tests, e2e tests, build, and lint.

### Post-Step Reassessment

- No nested `AGENTS.md` update is needed; only the root instruction file exists.
- Step 2 remains the correct next step, but it should reuse the current
  `src/app` and `src/adapters/inbound/http/controllers` layout established by
  this step.
- Step 3 remains dependent on Step 2 contracts and should not define provider
  DTOs in controller request or response objects.
- Step 4 remains too large as a single implementation step and should stay
  split by provider adapter.

## Step 2. Provider-independent latest-content contract

### Clarity Check

Small enough if limited to contracts, enums, request validation, and fake
adapter selection. Do not implement live provider API clients in this step.

### Red

- empty `sources` is rejected;
- unsupported source kind is rejected before adapter execution;
- `limitPerSource` is bounded;
- valid Reddit, Hacker News, journal API, and journal feed requests are accepted.

### Green

- define source-kind and provider enums in the narrowest owning module;
- define provider-independent request and response interfaces;
- define `ContentSourcePort.fetchLatestContentItems()`;
- add a registry contract that selects adapters by source kind/provider;
- keep HTTP DTO validation separate from provider adapter DTOs.

### Verify

- tests protect validation and adapter selection behavior;
- build, lint, and tests pass.

### Progress

- [x] Added latest-content source kind enums and provider enums in
  `src/app/content-item`.
- [x] Added provider-independent latest-content request and result interfaces.
- [x] Added `ContentSourcePort.fetchLatestContentItems()`.
- [x] Added `LatestContentRequestValidator` for empty sources, unsupported
  source kinds, bounded limits, and source-specific required fields.
- [x] Added `ContentSourceRegistry` for adapter selection by source kind.
- [x] Added behavior tests for validation and adapter selection.
- [x] Verified with unit tests, e2e tests, build, and lint.

### Post-Step Reassessment

- No nested `AGENTS.md` update is needed; no new durable architecture rule was
  introduced.
- Step 3 is now clear and should compose the existing
  `LatestContentRequestValidator`, `ContentSourceRegistry`, and
  `ContentSourcePort` rather than redefining request contracts.
- Step 3 should keep live provider calls out of scope by using fake adapters in
  tests and an empty registry until Step 4 adapters exist.
- Step 4 remains split by provider; each adapter must map external DTOs inside
  `src/adapters/outbound/content-source/*`.

## Step 3. Latest-content use case and REST endpoint

### Clarity Check

Clear and testable now that Step 2 contracts exist. This step should not add
live provider clients.

### Red

- `POST /content-items/latest` calls the use case;
- the use case invokes the selected adapter for each source;
- one failed source produces an error entry without dropping successful items
  from other sources;
- provider DTOs are not returned.

### Green

- implement `GetLatestContentItemsUseCase`;
- implement result merging and partial-error reporting;
- implement `LatestContentController`;
- use fake adapters for behavior tests;
- register the controller and use case in `AppModule`;
- wire the existing validator and registry into the use case.

### Verify

- endpoint tests pass for success and partial failure;
- build, lint, and tests pass.

### Progress

- [x] Implemented `GetLatestContentItemsUseCase`.
- [x] Implemented per-source partial error reporting.
- [x] Implemented `LatestContentController` for `POST /content-items/latest`.
- [x] Registered the controller, use case, validator, and empty registry in
  `AppModule`.
- [x] Added use-case and controller unit tests with fake adapters.
- [x] Added e2e coverage for success plus partial failure and invalid request
  handling.
- [x] Verified with unit tests, e2e tests, build, and lint.

### Post-Step Reassessment

- No nested `AGENTS.md` update is needed; only the root instruction file exists.
- Step 4a should add the first live adapter by implementing
  `ContentSourcePort` and registering it in the existing `ContentSourceRegistry`
  factory without changing the application use case or controller.
- Step 4b should follow the same adapter boundary and reuse the current partial
  error behavior for API failures.
- Step 4c should pick one initial journal metadata API provider first; adding
  all journal providers at once would make the step too large.

## Step 4. First live provider adapters

### Clarity Check

Too large if all providers are implemented at once. Split by adapter and keep
the `POST /content-items/latest` contract stable.

### Step 4a. Reddit community adapter

#### Red

- normalizes latest subreddit posts from fixtures;
- handles missing optional fields;
- bounds result count;
- maps API/auth failures to application errors;
- implements `ContentSourcePort` without changing the application contract.

#### Green

- implement Reddit OAuth API client;
- implement Reddit mapper;
- keep Reddit DTOs inside the adapter;
- register the adapter in the existing `ContentSourceRegistry` factory.

#### Verify

- fixture tests do not require live Reddit API;
- build, lint, and tests pass.

#### Progress

- [ ] Not started.

### Step 4b. Hacker News query adapter

#### Red

- normalizes HN Algolia story results from fixtures;
- supports query/date filters;
- bounds result count;
- maps API failures to application errors.

#### Green

- implement HN Algolia client;
- implement HN mapper;
- keep HN DTOs inside the adapter;
- register the adapter in the existing `ContentSourceRegistry` factory.

#### Verify

- fixture tests do not require the live HN API;
- build, lint, and tests pass.

#### Progress

- [ ] Not started.

### Step 4c. Journal API adapter

#### Red

- normalizes metadata article results from one initial API fixture;
- preserves DOI/URL/title/authors/publication date when present;
- rejects unsupported journal API providers;
- maps API failures to application errors.

#### Green

- implement one initial journal metadata API client first;
- use the existing provider enum values for Crossref, Europe PMC, NCBI
  E-utilities, and DOAJ;
- keep provider DTOs inside the adapter;
- register only implemented providers in the existing `ContentSourceRegistry`
  factory.

#### Verify

- fixture tests do not require live journal APIs;
- build, lint, and tests pass.

#### Progress

- [ ] Not started.

### Step 4d. Journal feed adapter

#### Red

- parses RSS and Atom fixtures with a structured parser;
- rejects non-feed source definitions;
- normalizes article metadata;
- bounds result count.

#### Green

- implement feed client;
- implement RSS/Atom parsing through a structured parser;
- implement feed mapper.

#### Verify

- fixture tests do not require live publisher feeds;
- build, lint, and tests pass.

#### Progress

- [ ] Not started.

## Step 5. Reassess next phase

After the two endpoints are implemented and verified, decide whether the next
phase should add persistence, source configuration, MCP exposure, comments, or
scheduled discovery.

### Progress

- [ ] Not started.

---

# Deferred From This Phase

```txt
POST   /sources
GET    /sources
GET    /sources/:sourceId
PATCH  /sources/:sourceId
POST   /sources/:sourceId/content-items/fetch
GET    /content-items
GET    /content-items/:contentItemId
POST   /content-items/:contentItemId/comments/fetch
GET    /content-items/:contentItemId/comments
GET    /content-items/:contentItemId/comment-branches
GET    /files/:fileId
GET    /files/:fileId/download-url
POST   /mcp
```

These endpoints remain useful later, but they are intentionally not part of the
current two-endpoint phase.

---

# API References Checked For Planning

- Reddit API documentation: https://old.reddit.com/dev/api/
- Hacker News Algolia API: https://hn.algolia.com/api
- Crossref REST API: https://www.crossref.org/documentation/retrieve-metadata/rest-api/
- Europe PMC RESTful Web Service: https://europepmc.org/RestfulWebService
- NCBI E-utilities/PubMed API: https://www.ncbi.nlm.nih.gov/home/develop/api/
- DOAJ metadata/API documentation: https://doaj.org/docs/faq/
