# Prompt Engineers AI — documentation

The knowledge base for the Prompt Engineers AI community website. Each topic has
one page: the narrative explanation and the lookup tables for that topic live
together.

New to the project? Start with [Getting started](getting-started.md), then read
[Architecture](architecture.md).

## Guides

| Topic                                                 | Page                                  |
| ----------------------------------------------------- | ------------------------------------- |
| Project overview, tech stack, local setup             | [Getting started](getting-started.md) |
| System design, layers, data flow, module graph        | [Architecture](architecture.md)       |
| JWT auth, middleware, sessions, password rules        | [Authentication](authentication.md)   |
| MongoDB, models, GridFS, types and schemas            | [Data layer](data-layer.md)           |
| Components, sections, design system, registry         | [Frontend](frontend.md)               |
| Pages, route protection, navigation                   | [Routing](routing.md)                 |
| Airtable, Brevo, Resend, Google Analytics, Medium RSS | [Integrations](integrations.md)       |
| PWA, service worker, Netlify deployment               | [Deployment](deployment.md)           |

## Reference

| Topic                                              | Page                                              |
| -------------------------------------------------- | ------------------------------------------------- |
| Every API endpoint with auth, body, responses      | [API](reference/api.md)                           |
| Environment variables, config files, feature flags | [Environment](reference/environment.md)           |
| Every source file with purpose and key exports     | [File index](reference/file-index.md)             |
| Project metadata, constraints, runtime limits      | [Project manifest](reference/project-manifest.md) |

## Conventions

- Keep one page per topic. Add a section, not a parallel file.
- Record limits, names, and IDs in [Project manifest](reference/project-manifest.md).
- Agent instructions live in [`AGENTS.md`](../AGENTS.md), not here.
