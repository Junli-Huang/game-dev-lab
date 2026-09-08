# Project workflow

User preference confirmed on 2026-09-08: when a development requirement is supplied,
implement it, validate it, merge to `main`, and deploy through GitHub Pages by default.
Wait for deployment to succeed and return the published URL. No additional merge or
publish confirmation is needed unless the user overrides this workflow for the task.

Run `npm test` and `npm run build` before merging. Follow `docs/prototype-guide.md`
and `docs/i18n-terminology.md`; new user-visible copy must support English and Chinese.
