#!/bin/bash

# Publishes the package to the NPM registry.
# Uses the latest GIT tag as the package version, the GIT tag should be in the format `1.0.0` or `1.0.0-beta.1`.
#
# Expected environment variables:
#   - NPM_PUBLISH_TOKEN: [REQUIRED] The NPM access token to publish the package.
#   - DRY_RUN: [OPTIONAL] If set to `true`, the package is not published to the NPM registry (the command is executed as a dry run).

if [ -z "$NPM_PUBLISH_TOKEN" ]; then
  echo "NPM_PUBLISH_TOKEN is missing"
  exit 1
fi

if ! [ -f ./package.json ]; then
  echo "Cannot find package.json file. Execute the command from the root of the package."
  exit 1
fi


# Check if we are on the main branch.
if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
    echo "You must be on the main branch to publish to the NPM registry."
    exit 1
fi

version=`git describe --tags --abbrev=0`

cat package.json | jq  --arg version "$version" '.version |= $version' > package.temp.json
mv -f package.temp.json package.json

npm config set registry https://registry.npmjs.org

# Log in to the NPM registry using the access token.
echo "//registry.npmjs.org/:_authToken=${NPM_PUBLISH_TOKEN}" >> ~/.npmrc
npm whoami || npm login

npm publish --dry-run="$DRY_RUN"
