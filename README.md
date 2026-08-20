<p align="center">
  <img src="public/xylvir-light.png" alt="Xylvir Logo" width="150" />
</p>

<h1 align="center">Xylvir</h1>

<p align="center">
  A modern, full-stack Next.js application with type-safe authentication, PostgreSQL database, and Hono API routes.
</p>

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **API**: Hono
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI)
- **Environment**: @t3-oss/env-nextjs with Zod validation
- **Tooling**: [Biome](https://biomejs.dev/) - Fast formatter and linter
- **Package Manager**: pnpm

## 📋 Prerequisites

- Node.js 20+ 
- pnpm (or npm/yarn)
- Docker & Docker Compose (for local database)

## 🛠️ Setup & Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd xylvir-light
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/xylvir

# API Configuration
API_URL=http://localhost:3000/api

# Better Auth Configuration
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long
BETTER_AUTH_URL=http://localhost:3000

# Frontend
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Supabase realtime for admin QR check-ins
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Admin QR check-in credential signing
CHECK_IN_QR_SECRET=your-secret-key-minimum-32-characters-long
```

**Important**: Generate a secure `BETTER_AUTH_SECRET` (minimum 32 characters):
```bash
openssl rand -base64 32
```

Use the same command to generate `CHECK_IN_QR_SECRET`; keep it server-only and do not expose it as a `NEXT_PUBLIC_` variable.

### 4. Start PostgreSQL database

```bash
docker-compose up -d
```

This will start a PostgreSQL 16 container on port 5432.

### 5. Run database migrations

```bash
pnpm db:migrate
```

This will:
- Apply database migrations
- Create the necessary tables (User, Session, Account, Verification)

### 6. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
xylvir-light/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (Hono handlers)
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   └── auth-form.tsx      # Authentication form
├── env/                    # Environment variable schemas
│   ├── client.ts          # Client-side env vars
│   └── server.ts          # Server-side env vars
├── db/                     # Database configuration
│   ├── schema/            # Drizzle schema definitions
│   ├── migrations/        # Database migrations
│   └── index.ts           # Drizzle database client
├── lib/                    # Shared utilities and libraries
│   ├── auth/              # Better Auth configuration
│   └── utils.ts           # Utility functions
├── server/                 # Backend API routes
│   └── routes/            # Hono route handlers
│       └── auth/          # Authentication routes
└── docker-compose.yml      # PostgreSQL container config
```

## 🎨 Coding Style & Conventions

### Frontend

- **React Server Components**: Default to Server Components; use `"use client"` only when needed
- **Component Organization**: 
  - UI components in `components/ui/`
  - Feature components in `components/`
  - Use functional components with hooks
- **Styling**: 
  - Tailwind CSS utility classes
  - Dark mode via `dark:` prefix
  - Use `cn()` utility for conditional classes
- **TypeScript**: 
  - Strict mode enabled
  - Explicit types for props
  - Use `Readonly<>` for component props
- **Path Aliases**: Use `@/` prefix for imports

**Example:**
```typescript
// app/page.tsx
import Image from "next/image"
import { AuthForm } from "@/components/auth-form"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <AuthForm />
    </div>
  )
}
```

### Backend

- **API Routes**: Use Hono framework with route-based organization
- **Type Safety**: 
  - Zod schemas for validation
  - Type-safe environment variables
  - Drizzle types for database operations
- **Database**: 
  - Drizzle ORM with PostgreSQL connection pooling
  - Schema definitions in `db/schema/`
  - Singleton pattern for database client
- **Async Operations**:
  - Use `better-all` for parallel async operations with dependencies
  - Automatic optimization over manual `Promise.all`
- **Route Structure**: 
  - Routes in `server/routes/`
  - Each route module exports a Hono router
  - Mount routes in `app/api/[[...routes]]/route.ts`

**Example:**
```typescript
// server/routes/auth/auth.route.ts
import { Hono } from 'hono'
import { auth } from '@/lib/auth'
import type { AuthType } from '@/lib/auth'

const router = new Hono<{ Bindings: AuthType }>({
  strict: false,
})

router.on(['POST', 'GET'], '/*', (c) => {
  return auth.handler(c.req.raw)
})

export default router
```

### Environment Variables

- **Separation**: Client and server env vars are separated
- **Validation**: All env vars validated with Zod schemas
- **Type Safety**: Import from `@/env/client` or `@/env/server`

**Example:**
```typescript
// Server-side
import { env } from "@/env/server"
const dbUrl = env.DATABASE_URL

// Client-side
import { env } from "@/env/client"
const baseUrl = env.NEXT_PUBLIC_BASE_URL
```

## 🔐 Authentication

This project uses Better Auth with email/password authentication.

### Features

- Email/password sign up and sign in
- Session management
- Type-safe auth hooks (`useSession`, `signIn`, `signUp`, `signOut`)

### Usage in Components

```typescript
"use client"

import { useSession, signOut } from "@/lib/auth/client"

export function MyComponent() {
  const { data: session, isPending } = useSession()
  
  if (isPending) return <div>Loading...</div>
  if (!session) return <div>Not authenticated</div>
  
  return (
    <div>
      <p>Welcome, {session.user.name}!</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}
```

### Server-Side Auth

```typescript
import { auth } from "@/lib/auth"

// In API routes or Server Components
const session = await auth.api.getSession({ headers: request.headers })
```

## 🗄️ Database

### Drizzle Commands

```bash
# Generate migration files from schema changes
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Push schema changes directly (dev only)
pnpm db:push

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

### Database Schema

The schema is defined in `db/schema/` using Drizzle ORM and includes:
- **User**: User accounts with email, name, and profile image
- **Session**: User sessions with token and metadata
- **Account**: OAuth and email/password accounts
- **Verification**: Email verification tokens

### Using Drizzle

```typescript
import { db } from "@/db"
import { users, sessions } from "@/db/schema"
import { eq } from "drizzle-orm"

// Query example
const allUsers = await db.select().from(users)

// Query with relations
const userWithSessions = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    sessions: true,
  },
})
```

## 🐳 Docker

### Database Management

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# Stop and remove all data
docker-compose down -v

# View logs
docker-compose logs -f postgres

# Check status
docker ps | grep xylvir-postgres
```

### Database Connection

- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `xylvir`
- **Username**: `postgres`
- **Password**: `postgres`

## 🧰 Code Quality with Biome

This project uses **[Biome](https://biomejs.dev/)**, a fast all-in-one toolchain that replaces ESLint and Prettier. Biome is ~35x faster than Prettier and provides excellent TypeScript and React support.

### Why Biome?

- **Blazing Fast**: Built with Rust, processes your entire codebase in milliseconds
- **All-in-One**: Combines formatting, linting, and import sorting in a single tool
- **97% Prettier Compatible**: Familiar formatting with better performance
- **Better Errors**: Clear, actionable error messages with context
- **Zero Config**: Works out of the box with sensible defaults

### Biome Commands

```bash
# Format code
pnpm format           # Format all files

# Lint code
pnpm lint             # Check for lint errors
pnpm lint:fix         # Fix lint errors automatically

# Check and fix everything
pnpm check            # Format, lint, and organize imports (recommended)
```

### Editor Integration

Install the Biome extension for your editor:
- **VSCode**: [Biome VSCode Extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
- **Other Editors**: See [Biome Editor Guides](https://biomejs.dev/guides/editors/first-party-extensions/)

### Configuration

Biome configuration is in `biome.json`. Key features:
- **2-space indentation** (matches project style)
- **Double quotes** for strings
- **Import sorting** enabled
- **TypeScript & React rules** from ESLint
- **CSS files excluded** (Tailwind CSS not fully supported)

## 📝 Available Scripts

```bash
# Development
pnpm dev              # Start Next.js dev server

# Build & Production
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm check            # Format, lint, and organize imports
pnpm format           # Format code with Biome
pnpm lint             # Lint code with Biome
pnpm lint:fix         # Fix linting errors

# Database
pnpm db:generate      # Generate migration files
pnpm db:migrate      # Apply migrations
pnpm db:push         # Push schema changes (dev)
pnpm db:studio       # Open Drizzle Studio

# Git & Commits
pnpm commit           # Interactive conventional commit tool
```

## 🔧 Git Hooks & Commit Standards

This project uses **Husky** for Git hooks and **Conventional Commits** for standardized commit messages.

### Pre-commit Hook

Every commit automatically runs:
- **Biome check** on staged files (format, lint, organize imports)
- Only modified files are checked (via `lint-staged`)

### Commit Message Standards

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Valid commit types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semi-colons, etc)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system or dependency changes
- `ci`: CI configuration changes
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

**Examples:**
```bash
feat(auth): add OAuth login support
fix(api): resolve timeout issue in user endpoint
docs(readme): update installation instructions
style: format code with biome
refactor(components): simplify button component logic
```

### Making Commits

**Option 1: Interactive commit tool (Recommended)**
```bash
pnpm commit
```
This launches an interactive prompt to help you write conventional commits.

**Option 2: Manual commits**
```bash
git add .
git commit -m "feat(auth): add password reset functionality"
```

The commit message will be validated automatically. If it doesn't follow the convention, the commit will be rejected.

### Bypassing Hooks (Not Recommended)

Only in emergencies:
```bash
git commit --no-verify -m "emergency fix"
```

## 🔧 Configuration Files

- **`next.config.ts`**: Next.js configuration
- **`tsconfig.json`**: TypeScript configuration with path aliases
- **`components.json`**: shadcn/ui configuration
- **`docker-compose.yml`**: PostgreSQL container configuration
- **`drizzle.config.ts`**: Drizzle Kit configuration
- **`db/schema/`**: Database schema definitions
- **`biome.json`**: Biome formatter and linter configuration
- **`commitlint.config.js`**: Commit message linting rules
- **`.lintstagedrc.js`**: Pre-commit staged files configuration
- **`.husky/`**: Git hooks directory

## 🚦 Development Workflow

### Initial Setup
1. **Start the database**: `docker-compose up -d`
2. **Run migrations**: `pnpm db:migrate`
3. **Start dev server**: `pnpm dev`
4. **Visit**: [http://localhost:3000](http://localhost:3000)

### Daily Development
1. **Create a feature branch**: `git checkout -b feat/my-feature`
2. **Make changes**: Edit files in `app/`, `components/`, or `server/`
3. **Test your changes**: Verify functionality in the browser
4. **Stage files**: `git add .`
5. **Commit**: `pnpm commit` (interactive) or `git commit -m "feat: add feature"`
   - Pre-commit hook automatically formats and lints staged files
   - Commit message is validated against conventional commits standard
6. **Push**: `git push origin feat/my-feature`

### Code Quality Checks

Before committing, you can manually run:
```bash
pnpm check          # Format, lint, and organize imports
pnpm format         # Format code only
pnpm lint           # Lint code only
```

Or let the pre-commit hook handle it automatically!

## 📦 Key Dependencies

### Runtime Dependencies
- **Next.js 16**: React framework with App Router
- **Hono**: Fast web framework for API routes
- **Better Auth**: Modern authentication library
- **Drizzle ORM**: Type-safe SQL query builder
- **[better-all](https://github.com/shuding/better-all)**: Optimized Promise.all with automatic dependency resolution
- **Tailwind CSS v4**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components (Radix UI)
- **Zod**: TypeScript-first schema validation
- **@t3-oss/env-nextjs**: Type-safe environment variables

### Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **Biome**: Fast formatter and linter (~35x faster than Prettier)
- **Husky**: Git hooks manager
- **lint-staged**: Run linters on staged files
- **Commitlint**: Enforce conventional commit messages
- **Commitizen**: Interactive commit message tool

## 🎯 Performance Optimization with better-all

This project uses **[better-all](https://github.com/shuding/better-all)** for automatic parallelization of async operations with dependencies.

### Why better-all?

Traditional `Promise.all` can be inefficient when tasks have dependencies. `better-all` automatically optimizes execution while maintaining readability.

**Traditional approach (inefficient):**
```typescript
// Sequential execution - 20 seconds total
const [user, posts] = await Promise.all([getUser(), getPosts()]) // 10s
const comments = await getComments(user.id)                       // 10s
```

**With better-all (optimized):**
```typescript
import { all } from 'better-all'

// Automatic parallelization - 11 seconds total
const { user, posts, comments } = await all({
  async user() { return getUser() },                    // 1s
  async posts() { return getPosts() },                  // 10s
  async comments() { return getComments(await this.$.user.id) } // 10s (runs in parallel with posts)
})
```

### Usage Examples

**Fetching user data with dependencies:**
```typescript
import { all } from 'better-all'
import { db } from '@/db'
import { users, profiles, posts } from '@/db/schema'
import { eq } from 'drizzle-orm'

const { user, profile, posts: userPosts, stats } = await all({
  async user() {
    return await db.query.users.findFirst({ where: eq(users.id, userId) })
  },
  async profile() {
    const user = await this.$.user
    return await db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) })
  },
  async posts() {
    const user = await this.$.user
    return await db.select().from(posts).where(eq(posts.authorId, user.id))
  },
  async stats() {
    const posts = await this.$.posts
    return { postCount: posts.length, totalViews: posts.reduce((sum, p) => sum + p.views, 0) }
  }
})
// user runs first, then profile and posts run in parallel, then stats uses posts
```

**API route optimization:**
```typescript
import { all } from 'better-all'
import { Hono } from 'hono'

const app = new Hono()

app.get('/dashboard/:userId', async (c) => {
  const userId = c.req.param('userId')
  
  const data = await all({
    async user() { return fetchUser(userId) },
    async settings() { return fetchSettings(userId) },
    async activities() {
      const user = await this.$.user
      return fetchActivities(user.id)
    },
    async notifications() {
      const user = await this.$.user
      return fetchNotifications(user.id)
    }
  })
  
  return c.json(data)
})
```

See the [better-all documentation](https://github.com/shuding/better-all) for more examples and features.

## 📋 Quick Reference

### Common Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm check` | Format, lint, and organize imports |
| `pnpm commit` | Interactive conventional commit |
| `docker-compose up -d` | Start PostgreSQL database |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm db:studio` | Open Drizzle Studio |

### Commit Message Format

```
<type>(<scope>): <subject>
```

**Examples:**
- `feat(auth): add OAuth login`
- `fix(api): resolve timeout issue`
- `docs: update README`
- `refactor(ui): simplify button component`

### File Structure Quick Guide

```
xylvir-light/
├── app/                    # Next.js pages and layouts
│   ├── api/               # API routes (Hono)
│   └── page.tsx           # Home page
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── server/                # Backend code
│   └── routes/           # Hono API route handlers
├── db/                    # Database configuration
│   ├── schema/           # Drizzle schema definitions
│   └── migrations/       # Database migrations
├── lib/                   # Shared utilities
│   └── auth/             # Better Auth config
├── env/                   # Environment variable schemas
├── biome.json             # Biome config
├── commitlint.config.js   # Commit message rules
└── .husky/                # Git hooks
```

## 🐛 Troubleshooting

### Port 5432 already in use

```bash
# Find and stop conflicting containers
docker ps | grep 5432
docker stop <container-name>

# Or kill process on port 5432
sudo lsof -i :5432 | awk 'NR>1 {print $2}' | xargs -r sudo kill -9
```

### Database client not initialized

```bash
# Ensure migrations are applied
pnpm db:migrate
```

### Environment variables not working

- Ensure `.env` file exists in root directory
- Check that all required variables are set
- Restart the dev server after changing `.env`

### Database connection errors

- Verify Docker container is running: `docker ps`
- Check database logs: `docker-compose logs postgres`
- Verify `DATABASE_URL` in `.env` matches docker-compose config

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Hono Documentation](https://hono.dev/)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
# web-conf
# web-conf
# web-conf
