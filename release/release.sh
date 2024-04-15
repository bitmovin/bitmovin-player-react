#!/bin/bash

dryRun=true

if [ -z "$NPM_PUBLISH_TOKEN" ]; then
  echo "NPM_PUBLISH_TOKEN is missing"
  exit 1
fi

# Check if we are on the main branch.
if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
    echo "You must be on the main branch to publish to NPM"
    exit 1
fi

npm config set registry https://registry.npmjs.org

# Log in to the NPM registry using the access token.
echo "//registry.npmjs.org/:_authToken=${NPM_PUBLISH_TOKEN}" >> ~/.npmrc
npm whoami || npm login

npm publish --dry-run="$dryRun"
