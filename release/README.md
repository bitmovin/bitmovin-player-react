# Release

- Merge a PR to the `main` branch
- Update the `CHANGELOG.md`
  - Create a new section with the release version in the `Released` section
  - Move the content of the `Unreleased` section to the new section
- Commit with a message with the content `Release <X.Y.Z>` and push to the `main` branch
- Create a new tag with the release version (`git tag <X.Y.Z> main`)
- Push the new tag to the repository (`git push origin <X.Y.Z>`)
- Release the package on NPM (`NPM_TOKEN=<token> ./release.sh`)