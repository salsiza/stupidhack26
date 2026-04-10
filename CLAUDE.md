# Project Guidelines

## Deployment

Every frontend change should end with:
1. Commit the changes
2. Build and deploy to production: `cd frontend && npm run build && npx wrangler pages deploy dist --project-name stupidhack2026 --branch main --commit-dirty=true`
3. Push to GitHub: `git push`
