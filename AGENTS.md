# Repository maintenance

- Preserve real Git history. Never rewrite published history or push without explicit authorization.
- Complete each independent feature or fix, run relevant checks, then create one Conventional Commit. Do not split changes just to increase commit count.
- Run `npm run check` before implementation commits. Record host-only checks and limitations honestly.
- Add meaningful automated tests for critical logic. Keep UI, domain logic, storage and host integration in separate modules as they emerge.
- Keep README, architecture documents and CHANGELOG consistent with implemented behavior.
- Only create version tags and release notes for an actual authorized release. Follow docs/releasing.md.
- Preserve user changes; do not invent screenshots, release dates or historical versions.
