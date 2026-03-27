# Ideas

## GitHub Stats Integration
Pull in live GitHub stats for projects (last commit, total commits, stars, etc.) using GitHub REST API with a personal access token. Display on project cards or dashboard. Use ISR (build-time fetch with revalidation) on Vercel for performance. Requires adding a `githubRepo` field to each project in `projects.ts`.
