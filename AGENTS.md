## Active Task Workflow

We work through a top-level markdown task file, usually named by the
user, such as `GENERAL_PLAN.md`.

The active task file should contain the task description, decomposition,
Red/Green/Verify notes, and implementation progress.

Before starting any step:

``` txt
- check whether the step is clear, small enough, and testable;
- split or clarify the step before implementation if it is too large, ambiguous, or missing Red/Green/Verify detail;
- stop and ask the user focused questions when ambiguity cannot be resolved from the workspace, current task file, or relevant AGENTS.md contracts.
```

Do not implement an unclear step just to preserve the existing plan
shape. First make the plan executable.

After each completed step:

``` txt
- mark the completed step in the active task file;
- describe what was implemented;
- reassess the next three steps in light of the work just completed;
- update those next steps when contracts, assumptions, scope, or remaining work changed;
- split or clarify any upcoming step that is too large or ambiguous;
- automatically check whether nested AGENTS.md files need updates;
- update nested AGENTS.md files when a new durable architecture rule appears.
```

Do not let the task file become stale. It is the local map for current
phase work.

## Constants And Enums

When a field has a closed set of string values, define an enum instead
of an inline string-literal union. Architecture examples may show raw
strings for readability; implementation code must use the corresponding
enum.

Example:

``` typescript
export const DEFAULT_SOURCE_ENABLED = true;

export enum CONTENT_SOURCE_KIND {
  REDDIT = 'reddit',
  HACKER_NEWS = 'hacker-news',
}

export const CONTENT_SOURCE_KIND_ARRAY = Object.values(CONTENT_SOURCE_KIND);
```

Pay attention to how we export the array of enum values.

## Project Architecture

This project strictly follows Hexagonal Architecture.

``` txt
src/
  domain/
  app/
  ports/
    inbound/
    outbound/
  adapters/
    inbound/
    outbound/
```

Rules:

-   `src/domain` contains domain entities, value objects, domain
    services, domain events, and business rules. It must not depend on
    frameworks or infrastructure.
-   `src/app` contains application use cases, application services,
    orchestration, and application DTOs.
-   `src/ports` contains contracts only.
-   `src/adapters` contains implementations of those contracts.
-   `src/ports/inbound` contains inbound port interfaces.
-   `src/ports/outbound` contains outbound port interfaces.
-   `src/adapters/inbound` contains driving adapters such as REST
    controllers, MCP endpoints, CLI commands, schedulers, and message
    consumers.
-   `src/adapters/outbound` contains driven adapters such as MongoDB
    repositories, HTTP clients, object storage adapters, Reddit
    adapters, RSS adapters, and other infrastructure integrations.
-   External APIs and provider-specific DTOs must never leak outside
    outbound adapters. Normalize external data before passing it into
    the application layer.
-   Dependencies must always point inward. Adapters depend on ports and
    application logic. Application depends on ports and domain. Domain
    depends on nothing outside itself.

## Environment Variables

Whenever adding, removing, or changing environment variables:

-   update both `.env` and `.env.example`;
-   never leave `.env.example` outdated;
-   use realistic placeholder values.

Conventions:

-   ports must have exactly the same values in `.env.example` as in
    `.env`;
-   passwords must use the placeholder `password`;
-   secrets, API secrets, signing keys, and tokens must use the
    placeholder `secret`;
-   URLs should point to localhost unless a different example is
    required.

## Coding Rules

Use the repo's existing patterns and narrowest reasonable module
ownership. Avoid unrelated refactors.

Method names must describe what the method does, not the business
pipeline or workflow in which it participates.

Use structured APIs/parsers instead of ad hoc string manipulation when
reasonable.

Add abstractions only when they remove real complexity, reduce
meaningful duplication, or match an established local pattern.

If required context is not available in the workspace or current
conversation, ask for the file or details before guessing. If the file
exists in the workspace, read it directly.

New code must not use `as`, `any`, the `object` type, or double
assertions such as `as unknown as`. Prefer precise narrowing,
discriminated unions, enums, generics, and explicit interfaces.

Prefer interfaces over type aliases for object shapes. For newly
introduced internal object-shape interfaces, use the `I` prefix. Do not
rename existing public contracts or ports without an explicit task.

When a field has a closed set of string values, use an enum instead
of a string-literal union.

When building objects with optional properties, prefer conditional
object spread over repeatedly mutating an initially empty object.
Preserve semantics for valid falsy values.

Prefer concise returns and ternaries when they improve readability.

Do not make cosmetic edits or reformat existing code just to match a
different personal style.

Do not remove user-written comments. Do not add new comments unless they
provide essential value.

Do not list unchanged files in summaries.

CRUD-style services should be batch-oriented by default.

Default to ASCII in files unless non-ASCII is required.

Do not use destructive git commands unless the user explicitly requests
them.
