# Prompt Engineers AI - Architecture Documentation

This directory contains comprehensive architecture documentation for the Prompt Engineers AI community website.

## Structure

### `wiki/` - Human-Readable Documentation
Narrative-style docs for developers onboarding to the project or looking to understand how things work.

| File | Topic |
|------|-------|
| [00-overview.md](wiki/00-overview.md) | Project overview, tech stack, quick start |
| [01-architecture.md](wiki/01-architecture.md) | High-level system architecture and design decisions |
| [02-authentication.md](wiki/02-authentication.md) | Auth system: JWT, middleware, session management |
| [03-data-layer.md](wiki/03-data-layer.md) | MongoDB, models, GridFS file storage |
| [04-api-reference.md](wiki/04-api-reference.md) | All API routes with request/response details |
| [05-frontend.md](wiki/05-frontend.md) | Components, sections, styling, and design system |
| [06-routing-navigation.md](wiki/06-routing-navigation.md) | Pages, routing, middleware, navigation |
| [07-integrations.md](wiki/07-integrations.md) | External services: Airtable, Brevo, GA, Medium RSS |
| [08-pwa-config.md](wiki/08-pwa-config.md) | PWA setup, service worker, deployment config |

### `ai-ref/` - AI-Optimized Reference
Structured, terse reference files optimized for LLM consumption. These provide fast lookups for code assistants.

| File | Purpose |
|------|---------|
| [project-manifest.md](ai-ref/project-manifest.md) | Structured project metadata and constraints |
| [file-index.md](ai-ref/file-index.md) | Every source file with purpose and key exports |
| [data-models.md](ai-ref/data-models.md) | All types, schemas, and database collections |
| [api-contracts.md](ai-ref/api-contracts.md) | API endpoints with method, auth, params, responses |
| [component-registry.md](ai-ref/component-registry.md) | Component props, dependencies, render behavior |
| [dependency-graph.md](ai-ref/dependency-graph.md) | Module import relationships and data flow |
| [env-config.md](ai-ref/env-config.md) | All environment variables, config files, feature flags |
