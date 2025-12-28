---
id: deploy-docs-vercel-en
title: Deploy docs to Vercel reliably
---

When Next.js and Docusaurus share one Vercel project, routing conflicts can cause 404s. Put docs in a separate project. Add rewrites only when you need `/docs/*` on the app domain.

## Goals

- Use `https://<docs-domain>/` as the default, and keep `https://<app-domain>/docs/...` only when needed.
- The docs project builds and serves the Docusaurus site.
- Build/CI should fail on 404 or broken links.

## Docs project (Vercel)

1. Add this repo as a separate Vercel project (e.g., `river-reviewer-docs`).
2. Build Command: `npm run build`; Output Directory: `build`.
3. Add env vars:
   - `DOCS_SITE_URL=https://<docs-domain>` (e.g., `https://river-reviewer-docs.vercel.app`)
   - `DOCS_BASE_URL=/` (optional; default is `/`)
   - `DOCS_ROUTE_BASE_PATH=/` (optional; default is `/`)
4. If you want `/docs/` to redirect to root, keep `vercel.json` as below:

```json
{
  "trailingSlash": true,
  "redirects": [{ "source": "/docs/", "destination": "/", "permanent": true }]
}
```

If you want `/docs/` as the base path, set `DOCS_BASE_URL=/docs/` and update redirects to point `/` -> `/docs/`.
If you omit `DOCS_BASE_URL`, the build targets GitHub Pages at `/river-reviewer/` as before.

## App project (e.g., `<app-domain>` / `river-reviewer.vercel.app`)

Add rewrites in the app `vercel.json` to forward `/docs/*` to the docs domain (docs served at `/`):

```json
{
  "rewrites": [
    { "source": "/docs", "destination": "https://<docs-domain>/" },
    { "source": "/docs/:path*", "destination": "https://<docs-domain>/:path*" }
  ]
}
```

## Quality gates

- `onBrokenLinks` and `onBrokenMarkdownLinks` are set to `throw`, so broken internal links fail the build.
- `npm run build` (optionally with `DOCS_BASE_URL=/docs/ DOCS_ROUTE_BASE_PATH=/`) verifies the chosen output path locally.
- The link checker workflow blocks PRs when external links break.
