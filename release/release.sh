#!/bin/bash

# Publishes the package to the NPM registry, commits the changes, and creates a new GIT tag, pushes them to the remote repository.
#
# Expected environment variables:
#   - NPM_PUBLISH_TOKEN: [REQUIRED] The NPM access token to publish the package.
#   - VERSION: [REQUIRED] The version of the package to publish.
#   - DRY_RUN: [OPTIONAL] If set to `true`, the package is not published to the NPM registry,
#     the commit and GIT tag are not pushed to the remote repository (the command is executed as a dry run).

echo "Releasing the package to the NPM registry"

if [ -z "$NPM_PUBLISH_TOKEN" ]; then
  echo "NPM_PUBLISH_TOKEN is missing"
  exit 1
fi

if [ -z "$VERSION" ]; then
  echo "VERSION is missing"
  exit 1
fi

if ! [ -f ./package.json ]; then
  echo "Cannot find package.json file. Execute the command from the root of the package."
  exit 1
fi

if [ "$(git status -s)" ]; then
  echo "Uncommited changes detected. Please commit your changes before publishing the package."
  exit 1
fi

if [ "$DRY_RUN" = true ] ; then
  echo "!!!! DRY RUN MODE !!!!"
fi

echo "Updating the CHANGELOG.md file"

currentDate=$(date '+%Y-%m-%d')
newReleasedContent="## [Unreleased]\n\n## ${VERSION} - ${currentDate}"
# Replace the current unreleased header with the new released header followed by the new version content.
sed -i '' "s/## \[Unreleased\]/${newReleasedContent}/" CHANGELOG.md

git add ./CHANGELOG.md

# Check if we are on the main branch.
if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
    echo "You must be on the main branch to publish to the NPM registry."
    exit 1
fi

echo "Updating the version and committing the changes"

# Updates the package.json, pacakge-lock.json, files, commits the changes, and creates a new GIT tag.
# Use `--force` to allow CHANGELOG.md changes to be committed as well.
npm version "$VERSION" --force
npm config set registry https://registry.npmjs.org

# Log in to the NPM registry using the access token.
echo "//registry.npmjs.org/:_authToken=${NPM_PUBLISH_TOKEN}" >> ~/.npmrc
npm whoami || npm login

echo "Publishing the package to the NPM registry"

npm publish --dry-run="$DRY_RUN"

echo "Pushing the changes to the remote repository"

if [ "$DRY_RUN" != true ] ; then
  git push --follow-tags
fi
