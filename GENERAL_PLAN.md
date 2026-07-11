# GENERAL_PLAN.md

## Goal

Build `signal-forge` as a reusable multi-source content ingestion service.

The first complete workflow:

```txt
Reddit source
  -> discovery
  -> normalized persistence
  -> percentile selection
  -> selected discussion branches
  -> MCP candidate retrieval
  -> processing feedback
```

Architecture and coding rules are defined in `AGENTS.md` and must not be duplicated here.

## Plan Rules

- Use TDD for every behavior change.
- Each step must be independently testable and deliver meaningful behavior.
- Split a step before implementation if it becomes too large.
- Merge it with an adjacent step if it becomes too small to produce useful behavior.
- Update this plan after every completed step.
- Reassess the next three steps after each completed step.

## Test Quality Rules

Tests must protect meaningful behavior.

Do not add tests that only:

- check enum members or enum values;
- check barrel-file exports;
- assert that a file, class, interface, or method exists;
- duplicate TypeScript compiler checks;
- lock implementation details without protecting behavior.

Prefer tests for:

- business rules;
- validation;
- normalization;
- state transitions;
- deduplication;
- idempotency;
- selection policies;
- adapter mapping;
- persistence behavior;
- error handling;
- public REST or MCP behavior.

Every step ends with:

```txt
Build, lint, and tests pass.
```

---

## Step 1. Project foundation

Prepare configuration, environment validation, test infrastructure, and application bootstrap.

### Red

- invalid required configuration prevents startup;
- valid configuration is normalized into the internal configuration model.

### Green

- add typed configuration loading;
- create and synchronize `.env` and `.env.example`;
- keep application bootstrap minimal.

### Definition of Done

- [ ] Invalid configuration fails deterministically.
- [ ] Valid configuration is available through a typed internal model.
- [ ] `.env` and `.env.example` follow `AGENTS.md`.
- [ ] Build, lint, and tests pass.

---

## Step 2. Normalized content domain model

Define provider-independent models for content, engagement metrics, discussions, media references, and lifecycle states.

### Red

Test meaningful invariants:

- content requires a source provider and external identifier;
- discussion nodes cannot reference themselves as parents;
- invalid negative metrics are rejected;
- invalid lifecycle transitions are rejected.

### Green

- implement the minimum domain entities and value objects;
- exclude provider-specific DTOs and framework dependencies.

### Definition of Done

- [ ] Content, discussion, engagement, and media-reference models exist.
- [ ] Invalid states cannot be created through public APIs.
- [ ] Domain invariants have meaningful tests.
- [ ] Build, lint, and tests pass.

---

## Step 3. Application ports

Define the minimum inbound and outbound contracts required by the first workflow.

### Red

Use fake implementations to prove that:

- application behavior works without infrastructure;
- unsupported source capabilities are rejected before adapter execution.

### Green

Define ports for:

- source configuration;
- discovery;
- materialization;
- discussion retrieval;
- content persistence;
- discussion persistence;
- metric snapshots;
- candidate retrieval and feedback;
- media metadata and binary storage.

### Definition of Done

- [ ] Required inbound and outbound ports exist.
- [ ] Port signatures contain only domain or application contracts.
- [ ] No external provider or infrastructure DTOs leak into ports.
- [ ] Build, lint, and tests pass.

---

## Step 4. Source configuration use cases

Implement registering, updating, enabling, disabling, and listing source configurations.

### Red

Test:

- new source registration;
- duplicate rejection;
- update behavior;
- disable without deletion;
- preservation of valid falsy values;
- invalid policy rejection.

### Green

- implement source configuration use cases;
- use in-memory outbound adapters in tests.

### Definition of Done

- [ ] Sources can be registered, updated, enabled, disabled, and listed.
- [ ] Duplicate and invalid configurations are handled explicitly.
- [ ] Build, lint, and tests pass.

---

## Step 5. Discovery orchestration

Implement generic metadata-only discovery for enabled sources.

### Red

Test:

- correct adapter selection;
- disabled sources are skipped;
- repeated discovery is idempotent;
- existing items are updated instead of duplicated;
- adapter failures do not corrupt persisted data;
- provider data is normalized before persistence.

### Green

- implement discovery orchestration;
- add adapter resolution;
- persist normalized lightweight records and latest metrics.

### Definition of Done

- [ ] Discovery is source-independent.
- [ ] Repeated discovery is idempotent.
- [ ] Failures are explicit and recoverable.
- [ ] Build, lint, and tests pass.

---

## Step 6. MongoDB persistence for sources and content

Implement MongoDB outbound adapters for source configurations and normalized content.

### Red

Integration-test:

- source persistence;
- content upsert by provider and external identifier;
- latest-metric updates;
- unique-key behavior;
- mapping without persistence DTO leakage.

### Green

- add MongoDB schemas and indexes;
- implement repository adapters;
- map persistence documents to internal models.

### Definition of Done

- [ ] Source and content repositories use MongoDB.
- [ ] Idempotency is enforced by indexes and repository behavior.
- [ ] MongoDB types do not leak outside outbound adapters.
- [ ] Build, lint, and tests pass.

---

## Step 7. Discussion and metric-snapshot persistence

Store normalized discussion branches and historical metric snapshots.

### Red

Test:

- parent-child context is preserved;
- duplicate nodes are not created;
- metric snapshots are append-only;
- snapshots are returned chronologically;
- discussions are linked to the correct root content item.

### Green

- implement discussion and snapshot repositories;
- add required indexes.

### Definition of Done

- [ ] Discussion context can be stored and retrieved.
- [ ] Metric history is preserved.
- [ ] Duplicate ingestion is deterministic.
- [ ] Build, lint, and tests pass.

---

## Step 8. Reddit discovery adapter

Implement Reddit post discovery as the first source adapter.

### Red

Fixture-test:

- post normalization;
- missing optional fields;
- pagination;
- malformed responses;
- transient failures;
- exclusion of irrelevant provider fields.

### Green

- implement the Reddit client;
- normalize Reddit posts;
- add pagination and bounded retry behavior.

### Definition of Done

- [ ] Reddit discovery implements the generic source contract.
- [ ] Pagination works.
- [ ] Provider DTOs remain inside the adapter.
- [ ] Default tests do not require the live Reddit API.
- [ ] Build, lint, and tests pass.

---

## Step 9. Reddit discussion adapter

Retrieve and normalize Reddit comment trees.

### Red

Test:

- nested-comment mapping;
- parent paths;
- deleted authors;
- deferred comment groups;
- retained metrics and identifiers;
- malformed cycles;
- context reconstruction for selected comments.

### Green

- implement comment retrieval and normalization;
- preserve enough context for later branch selection.

### Definition of Done

- [ ] Reddit discussions are normalized.
- [ ] Parent context is preserved.
- [ ] Deferred groups are handled or explicitly reported.
- [ ] Build, lint, and tests pass.

---

## Step 10. Percentile selection

Implement source-independent percentile and absolute-threshold selection.

### Red

Test:

- odd and even datasets;
- interpolation;
- ties;
- empty and single-item inputs;
- minimum absolute thresholds;
- combined percentile and absolute rules;
- reconstruction of complete comment branches.

### Green

- implement percentile calculation;
- implement post selection;
- implement comment selection and branch reconstruction.

### Definition of Done

- [ ] Post and comment selection are configurable.
- [ ] Calculations are deterministic.
- [ ] Selected branches contain required context.
- [ ] Build, lint, and tests pass.

---

## Step 11. Candidate lifecycle and feedback

Implement candidate retrieval, claiming, processing outcomes, and feedback.

### Red

Test:

- only eligible candidates are returned;
- concurrent double-claim is prevented;
- expired claims are recoverable;
- success and rejection transitions;
- feedback does not overwrite ingestion data;
- filtering by source, provider, age, and status.

### Green

- implement candidate lifecycle use cases;
- add persistence and claim-timeout behavior.

### Definition of Done

- [ ] Candidates can be queried, claimed, completed, and rejected.
- [ ] Expired claims can be recovered.
- [ ] Feedback is stored separately.
- [ ] Build, lint, and tests pass.

---

## Step 12. Media metadata

Add normalized media metadata and source media policies without downloading all binaries.

### Red

Test:

- image and video metadata normalization;
- invalid sizes and unsupported media;
- source URL preservation;
- policy evaluation;
- duplicate reference handling.

### Green

- implement media metadata models and persistence;
- implement policy evaluation.

### Definition of Done

- [ ] MongoDB stores media metadata and references only.
- [ ] Media policies are enforced.
- [ ] Duplicate media references are handled.
- [ ] Build, lint, and tests pass.

---

## Step 13. S3-compatible binary storage

Add MinIO-compatible binary media storage with content-addressed keys.

### Red

Integration-test:

- store and retrieve;
- SHA-256 calculation;
- identical-content deduplication;
- size-limit rejection;
- safe storage keys;
- interrupted-upload cleanup.

### Green

- implement the storage adapter;
- add MinIO;
- use staging and permanent object keys;
- keep full video download optional.

### Definition of Done

- [ ] Binary media is stored outside MongoDB.
- [ ] SHA-256 deduplication works.
- [ ] Size limits and safe keys are enforced.
- [ ] Build, lint, and tests pass.

---

## Step 14. REST administration adapter

Expose source management, manual discovery, candidate retrieval, and health diagnostics.

### Red

E2E-test:

- source registration;
- invalid input;
- discovery trigger;
- candidate listing;
- stable error responses;
- dependency health reporting.

### Green

- implement thin REST controllers;
- validate requests;
- map application errors to HTTP responses.

### Definition of Done

- [ ] Administrative REST operations work.
- [ ] Controllers contain no business logic.
- [ ] Health reports required dependencies.
- [ ] Build, lint, and tests pass.

---

## Step 15. MCP adapter for Hermes

Expose the minimum useful MCP tool set through Streamable HTTP.

Initial tools:

- list sources;
- register or update a source;
- run discovery;
- get new candidates;
- get candidate details;
- get selected discussion branches;
- claim a candidate;
- submit an outcome or feedback.

### Red

Protocol-test:

- initialization;
- tool listing;
- valid invocation;
- invalid arguments;
- application-error mapping;
- bounded responses;
- authentication.

### Green

- implement the MCP endpoint;
- define concise schemas and descriptions;
- call inbound application ports;
- add token authentication.

### Definition of Done

- [ ] Hermes can initialize and list tools.
- [ ] Tools invoke application use cases.
- [ ] Results are bounded and structured.
- [ ] Authentication is supported.
- [ ] Build, lint, and tests pass.

---

## Step 16. Scheduled discovery

Run discovery automatically for enabled, due sources.

### Red

Test:

- only due sources run;
- disabled sources are skipped;
- overlapping runs are prevented;
- failures are recorded;
- time behavior is deterministic through an injected clock.

### Green

- implement a thin scheduler adapter;
- add run locking and execution history.

### Definition of Done

- [ ] Due sources are processed automatically.
- [ ] Overlapping runs are prevented.
- [ ] Run history is recorded.
- [ ] Build, lint, and tests pass.

---

## Step 17. Docker Compose deployment

Provide the local application, MongoDB, MinIO, persistent volumes, and health checks.

Keep this Compose project independent from Hermes.

### Red

Smoke-test or verify:

- startup waits for dependencies;
- readiness becomes healthy;
- data survives restart;
- REST and MCP are reachable;
- MongoDB and MinIO are not unnecessarily exposed.

### Green

- add Dockerfile and `docker-compose.yml`;
- configure health checks and persistent volumes;
- document startup and shutdown.

### Definition of Done

- [ ] The Docker image builds.
- [ ] `docker compose up -d --build` starts a healthy stack.
- [ ] Persistent data survives restart.
- [ ] REST and MCP are reachable.
- [ ] Internal services are not exposed without need.
- [ ] Build, lint, and tests pass.

---

## Step 18. End-to-end Reddit workflow

Verify the complete first workflow:

```txt
configured source
  -> discovery
  -> persistence
  -> percentile selection
  -> discussion branches
  -> MCP candidate
  -> claim
  -> feedback
```

### Red

Create a deterministic end-to-end test or test harness using fixtures.

### Green

- connect the existing components;
- fix integration gaps only;
- do not introduce unrelated features.

### Definition of Done

- [ ] The workflow succeeds from a clean environment.
- [ ] Repeated discovery does not duplicate data.
- [ ] Selected branches preserve context.
- [ ] MCP responses are concise and usable by Hermes.
- [ ] Feedback is persisted.
- [ ] Build, lint, and tests pass.

---

## Deferred Until Step 18 Is Complete

- automatic percentile optimization;
- semantic classification of valuable discussion patterns;
- embeddings or vector databases;
- cloud LLM analysis;
- article generation;
- automatic publishing;
- Telegram interaction;
- additional source adapters;
- distributed queues;
- Kubernetes;
- multi-tenancy;
- analytics dashboards.
