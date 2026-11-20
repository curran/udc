# Publishing @vizhub/udc

This package uses the npm trusted publisher flow. Configure npm's GitHub Actions trusted publisher for `vizhub-studio/udc`, workflow `publish.yml`, before publishing. Do not embed npm credentials in the repository. Ensure the release workflow has OIDC permission and npm CLI supports trusted publishing.

1. Confirm the default branch has passed `npm run check` and the package version matches the intended major release. `npm publish` runs `prepublishOnly` (`npm run check`) and `prepack` (`npm run build`), so the tarball is rebuilt from the verified source even though `dist/` is git-ignored.
2. Create an annotated tag `v2.0.0` on the verified commit and push it, dispatch the publish workflow on the verified ref, or explicitly create the one-time `release/npm-v2.0.0` branch from that same commit. The release branch is deleted by the workflow after its attempt.
3. Inspect the npm publishing action for a successful provenance-backed `npm publish`. A GitHub merge by itself is not an npm release.
4. Verify `npm view @vizhub/udc@2.0.0 version dist.integrity` and `npm install @vizhub/udc@2.0.0` from an empty environment. Exercise `aggregateCube` through the published artifact.
5. Only then upgrade consumer applications from `1.0.0` to `2.0.0`.

Do not overwrite or republish an existing npm version. Release tags should be immutable. This major release changes the public `MeasureDefinition` schema: `aggregation` is mandatory. It also introduces a distinct `AggregatedCube` result stage.
