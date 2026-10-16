---
name: developer-workflow
description: Standard git workflow, branch conventions, commit message format validation, and pull reports for the Campus Control team.
---

# Developer Workflow Skill

## 1. Branch Strategy
- Every team member works on a persistent branch: `developer/MemberName` (e.g. `developer/Diego`, `developer/Conde`, `developer/Mayorga`, `developer/Mafe`, `developer/Guerra`).
- Never push directly to `main`.
- Integrations to `main` happen exclusively via pull requests.

## 2. Commit Message Convention
Every commit subject must strictly follow this format:
```text
type: :gitmoji: EnglishActionInUpperCamelCase
```

Allowed types and gitmojis:
- `feat: :sparkles: ActionName`
- `fix: :bug: ActionName`
- `docs: :memo: ActionName`
- `refactor: :recycle: ActionName`
- `test: :white_check_mark: ActionName`
- `chore: :wrench: ActionName`
- `ci: :green_heart: ActionName`
- `build: :package: ActionName`
- `perf: :zap: ActionName`
- `style: :art: ActionName`

### Validation command before committing:
```powershell
py scripts/validate_commit_messages.py --title "feat: :sparkles: ExampleAction"
```

## 3. Pull Report Protocol
After running `git fetch origin` and `git pull --ff-only`, report to the team the status of every visible `developer/*` branch following this structure:
`developer/Name | implemented | evidence (commit/PR/files) | integrated or pending | new in this pull | blockers`
