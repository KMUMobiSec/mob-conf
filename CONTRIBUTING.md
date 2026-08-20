# Contributing to Xylvir

Thank you for your interest in contributing to Xylvir! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please:

- Be respectful and considerate in all communications
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Accept responsibility for your mistakes and learn from them

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- Git

### Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/xylvir-light.git
   cd xylvir-light
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/xylvir-light.git
   ```

4. **Install dependencies**:
   ```bash
   pnpm install
   ```

5. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your local settings
   ```

6. **Start the database**:
   ```bash
   docker-compose up -d
   ```

7. **Run migrations**:
   ```bash
   pnpm db:migrate
   ```

8. **Start development server**:
   ```bash
   pnpm dev
   ```

## Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feat/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation changes
- `refactor/*` - Code refactoring
- `chore/*` - Maintenance tasks

### Creating a Feature Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feat/your-feature-name
```

### Making Changes

1. Make your changes in small, focused commits
2. Follow the [code style guidelines](#code-style)
3. Add tests for new functionality
4. Update documentation if needed
5. Run checks before committing:
   ```bash
   pnpm check      # Format, lint, organize imports
   pnpm test       # Run tests
   pnpm typecheck  # Type checking
   ```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type       | Description                                      |
| ---------- | ------------------------------------------------ |
| `feat`     | New feature                                      |
| `fix`      | Bug fix                                          |
| `docs`     | Documentation changes                            |
| `style`    | Code style changes (formatting, semicolons)      |
| `refactor` | Code refactoring (no feature/fix)                |
| `perf`     | Performance improvements                         |
| `test`     | Adding or updating tests                         |
| `build`    | Build system or dependency changes               |
| `ci`       | CI configuration changes                         |
| `chore`    | Other changes (maintenance)                      |
| `revert`   | Reverts a previous commit                        |

### Examples

```bash
# Feature
feat(auth): add OAuth Google login

# Bug fix
fix(api): resolve timeout in user endpoint

# Documentation
docs: update installation instructions

# With scope
refactor(ui): simplify button component logic
```

### Using Commitizen

For guided commits, use:

```bash
pnpm commit
```

## Pull Request Process

### Before Submitting

1. **Sync your branch** with the latest upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**:
   ```bash
   pnpm check
   pnpm test
   pnpm typecheck
   pnpm build
   ```

3. **Ensure tests pass** and coverage is maintained

### Creating a PR

1. Push your branch to your fork
2. Open a Pull Request against `main` (or `develop` for features)
3. Fill out the PR template completely
4. Link any related issues

### PR Title Format

Follow the same convention as commits:

```
feat(scope): add new feature
fix(scope): resolve bug
```

### Review Process

- PRs require at least one approval
- Address all review comments
- Keep PRs focused and reasonably sized
- Squash commits if requested

## Code Style

### General Rules

- **Indentation**: 2 spaces
- **Quotes**: Double quotes
- **Semicolons**: Required
- **Line width**: 100 characters

### Biome

We use Biome for formatting and linting. Run:

```bash
pnpm check        # Check and fix all issues
pnpm format       # Format only
pnpm lint         # Lint only
pnpm lint:fix     # Lint and fix
```

### TypeScript

- Use strict mode
- Explicit types for function parameters
- Use path aliases (`@/`)
- Prefer `interface` over `type` for object shapes
- Use `Readonly<>` for component props

### React

- Functional components with hooks
- Default to Server Components
- Use `"use client"` only when necessary
- Use `cn()` utility for conditional classes

### File Naming

| Type        | Convention                   | Example                   |
| ----------- | ---------------------------- | ------------------------- |
| Components  | `kebab-case.tsx`             | `todo-item.tsx`           |
| Pages       | `page.tsx`                   | `page.tsx`                |
| Services    | `<feature>.service.ts`       | `todo.service.ts`         |
| Validators  | `<feature>.validators.ts`    | `todo.validators.ts`      |
| Middleware  | `<name>.middleware.ts`       | `auth.middleware.ts`      |
| Routes      | `<feature>.route.ts`         | `todo.route.ts`           |
| Types       | `index.ts` in `_types/`      | `_types/index.ts`         |

## Testing

### Running Tests

```bash
pnpm test          # Run tests in watch mode
pnpm test:ci       # Run tests once (CI mode)
pnpm test:ui       # Run tests with UI
pnpm test:coverage # Run tests with coverage
```

### Writing Tests

- Place tests next to the code: `component.tsx` → `component.test.tsx`
- Or use `__tests__/` directories for grouping
- Follow the AAA pattern: Arrange, Act, Assert
- Test behavior, not implementation

### Test Structure

```typescript
import { describe, it, expect } from "vitest";

describe("ComponentName", () => {
  it("should do something specific", () => {
    // Arrange
    const input = "test";

    // Act
    const result = doSomething(input);

    // Assert
    expect(result).toBe("expected");
  });
});
```

## Reporting Issues

### Bug Reports

Include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Detailed steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, Node version, browser
6. **Screenshots/Logs**: If applicable

### Feature Requests

Include:

1. **Problem Statement**: What problem does this solve?
2. **Proposed Solution**: Your suggested approach
3. **Alternatives Considered**: Other options explored
4. **Additional Context**: Screenshots, mockups, etc.

## Questions?

Feel free to:

- Open a [Discussion](../../discussions) for general questions
- Check existing [Issues](../../issues) for known problems
- Review the [README](README.md) for setup instructions

---

Thank you for contributing to Xylvir! 🎉

