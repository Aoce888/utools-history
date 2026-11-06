# Contributing

Use Node.js 22.12+. Run npm ci, then npm run dev. Before implementation commits run npm run check and relevant host checks.

Use one complete Conventional Commit per independent change: feat:, fix:, refactor:, docs:, test:, chore:. Preserve real history; never push without authorization or rewrite published history.

Separate UI, domain logic, storage and host adapters as features emerge. Test meaningful boundary and failure cases. CI cannot replace Windows/uTools verification.

Bug reports should include environment, reproduction, expected and actual behavior. Redact personal titles and paths from logs and screenshots.
