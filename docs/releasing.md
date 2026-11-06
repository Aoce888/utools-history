# Release procedure

No release is currently scheduled. Do not tag infrastructure changes as product releases.

1. Agree on version and scope; run npm ci and npm run check.
2. Verify installation, entry points, interactions and relevant privacy/data behavior in Windows/uTools. Record environment and results.
3. Move delivered CHANGELOG entries into the actual version and date. Prepare release notes from release-notes-template.md with real artifacts and limitations.
4. Commit release changes, confirm a clean tree, then create an annotated tag with git tag -a vX.Y.Z -m "Release vX.Y.Z". Never move published tags.
5. Push commits/tags or publish remote releases only after explicit user authorization.

Include actual screenshots and host acceptance results before releasing.
