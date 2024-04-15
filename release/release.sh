#!/bin/bash

dryRun=true

if [ -z "$NPM_PUBLISH_TOKEN" ]; then
  echo "NPM_PUBLISH_TOKEN is missing"
  exit 1
fi

if ! [ -f ./package.json ]; then
  echo "Cannot find package.json file. Execute the command from the root of the project."
  exit 1
fi


# Check if we are on the main branch.
if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
    echo "You must be on the main branch to publish to NPM"
    exit 1
fi

version=`git describe --tags --abbrev=0`

cat package.json | jq  --arg version "$version" '.version |= $version' > package.temp.json
mv -f package.temp.json package.json

npm config set registry https://registry.npmjs.org

# Log in to the NPM registry using the access token.
echo "//registry.npmjs.org/:_authToken=${NPM_PUBLISH_TOKEN}" >> ~/.npmrc
npm whoami || npm login

npm publish --dry-run="$dryRun"
