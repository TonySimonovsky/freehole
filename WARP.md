# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Repository overview
- This repository currently contains no application code or tooling. No build system, linter, or test framework is configured yet.
- Update this file once tooling (e.g., package.json, pyproject.toml, Makefile) and source code are added.

Commands
- Build: not configured
- Lint: not configured
- Tests: not configured (single-test runs not applicable)

Architecture
- No project structure is present yet. Once code is added, document the high-level architecture here (domains/modules, key entrypoints, and cross-cutting concerns) so agents can navigate effectively.


## Commit Standards

Use consistent, semantic commit messages.

Format: <type>(<scope>): <subject>

### Types
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation changes
style:    # Code style changes (formatting, semicolons, etc)
refactor: # Code refactoring without feature changes
perf:     # Performance improvements
test:     # Test additions or fixes
chore:    # Build tasks, dependencies, etc
revert:   # Revert a previous commit

### Examples
feat(auth): add OAuth2 Google login
fix(api): handle null response from payment service
docs(readme): update installation instructions
perf(db): add index on users.email column
test(user): add integration tests for registration

### Multi-line for complex changes
fix(cart): resolve race condition in checkout

- Add mutex lock during payment processing
- Prevent double-charging on rapid clicks
- Add integration test for concurrent checkouts
