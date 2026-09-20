<h1 align="center">🤖 Prompt Engineers AI</h1>

<p align="center"><strong>Community website for the Prompt Engineers AI developer group — Dallas / Plano, TX</strong></p>

<p align="center">
  <a href="https://github.com/promptengineers-ai/website/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/promptengineers-ai/website/ci.yml?style=plastic&label=CI&labelColor=0B1220&color=7C3AED"></a>
  <a href="https://github.com/promptengineers-ai/website/issues"><img alt="Issues" src="https://img.shields.io/github/issues/promptengineers-ai/website?style=plastic&labelColor=0B1220&color=7C3AED"></a>
  <img alt="Next.js 14" src="https://img.shields.io/badge/Next.js-14-7C3AED?style=plastic&logo=nextdotjs&logoColor=white&labelColor=0B1220">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-7C3AED?style=plastic&logo=typescript&logoColor=white&labelColor=0B1220">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-7-7C3AED?style=plastic&logo=mongodb&logoColor=white&labelColor=0B1220">
</p>

**A full-stack Next.js app for a 1,700+ member AI developer community.** It runs
member profiles, a searchable member directory, hackathon registration and team
management, and the public landing site.

Custom JWT authentication, MongoDB with GridFS file storage, and Tailwind. No
ORM and no auth framework — the data and auth layers are direct and readable.

Start with the quickstart below. See the [documentation](docs/README.md) for
architecture, API, and reference material.

## 📦 Quickstart

Prerequisites: Node.js ≥ 20, and either Docker or a MongoDB 7 database (local or Atlas).

### 1. Install

```bash
git clone https://github.com/promptengineers-ai/website.git
cd website
pnpm install
```

### 2. Start MongoDB

Skip this if you use MongoDB Atlas or an existing server. Otherwise run MongoDB 7
in Docker with a named volume so data survives a container restart:

```bash
docker run -d \
  --name mongo \
  -p 27017:27017 \
  -v data_mongo:/data/db \
  -e MONGO_INITDB_ROOT_USERNAME=mongo \
  -e MONGO_INITDB_ROOT_PASSWORD=mongo \
  --restart unless-stopped \
  mongo:7
```

Use this connection string:

```env
MONGO_DB_URI=mongodb://mongo:mongo@localhost:27017/pe_prod?authSource=admin
```

The database name in the URI path is required — the app calls `client.db()` with
no argument and reads the name from the URI. `authSource=admin` is required
because the `mongo` user is created in the `admin` database, not in `pe_prod`.

The credential environment variables apply only when the volume is empty. To
change them later, remove the volume and start over.

### 3. Configure the environment

Copy the example file and fill in the two required values:

```bash
cp .example.env .env
```

| Variable                               | Required | Purpose                             |
| -------------------------------------- | -------- | ----------------------------------- |
| `MONGO_DB_URI`                         | Yes      | MongoDB connection string           |
| `NEXTAUTH_SECRET`                      | Yes      | JWT signing secret for auth cookies |
| `NEXT_PUBLIC_APP_URL`                  | No       | Base URL used in email links        |
| `RESEND_API_KEY` · `RESEND_FROM_EMAIL` | No       | Transactional email                 |
| `AIRTABLE_API_KEY`                     | No       | Contact-form forwarding             |
| `BREVO_API_KEY`                        | No       | Newsletter subscriptions            |
| `NEXT_PUBLIC_GA_ID`                    | No       | Google Analytics                    |

Generate a secret:

```bash
openssl rand -base64 32
```

Every variable is documented in [Environment](docs/reference/environment.md).

### 4. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Create an admin user (optional)

```bash
pnpm dlx ts-node --compiler-options '{"module":"commonjs"}' scripts/create-admin.ts
```

Seed hackathon data the same way with `scripts/seed-hackathon.ts`.

## 🛠️ Commands

| Command              | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| `pnpm dev`           | Development server at `localhost:3000`           |
| `pnpm build`         | Production build                                 |
| `pnpm start`         | Production server                                |
| `pnpm lint`          | ESLint (`next/core-web-vitals`, exhaustive-deps) |
| `pnpm test`          | Vitest unit and component tests                  |
| `pnpm test:watch`    | Vitest in watch mode                             |
| `pnpm test:coverage` | Vitest with coverage                             |

## ✨ Features

- **Authentication** — JWT in HTTP-only cookies, 30-day expiry with auto-refresh, bcrypt password hashing.
- **Member profiles** — social links, markdown background, avatar and resume upload via GridFS.
- **Member directory** — paginated, searchable listing of the community.
- **Hackathons** — registration, team creation, and team management.
- **Landing site** — hero, projects, roadmap, contact, and Medium RSS feed.
- **PWA** — installable with a service worker.

## 📚 Table of Contents

Browse the [documentation](docs/README.md) or jump to a topic below.

| Topic             | Documentation                                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Getting started   | [Overview and local setup](docs/getting-started.md)                                                                                                |
| System design     | [Architecture](docs/architecture.md)                                                                                                               |
| Auth              | [Authentication](docs/authentication.md)                                                                                                           |
| Data              | [Data layer](docs/data-layer.md) · [API reference](docs/reference/api.md)                                                                          |
| UI                | [Frontend](docs/frontend.md) · [Routing](docs/routing.md)                                                                                          |
| External services | [Integrations](docs/integrations.md)                                                                                                               |
| Shipping          | [PWA and deployment](docs/deployment.md)                                                                                                           |
| Reference         | [Environment](docs/reference/environment.md) · [File index](docs/reference/file-index.md) · [Project manifest](docs/reference/project-manifest.md) |
| Agents            | [AGENTS.md](AGENTS.md)                                                                                                                             |

## 🤝 Contributing

Contributions, bug reports, and feedback are welcome. Open an
[issue](https://github.com/promptengineers-ai/website/issues) or a pull request.
CI runs lint and tests on every push — keep both green.

Read [AGENTS.md](AGENTS.md) before changing code with a coding agent.
