#!/bin/bash

nonInteractive=false
dryRun=true

if [ -z "$NPM_RELEASE_TOKEN" ]; then
    read -s -p "Enter your NPM access token: " NPM_RELEASE_TOKEN
    echo
fi

# Check if we are on the main branch.
if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
    echo "You must be on the main branch to publish to NPM"
    exit 1
fi

VERSION=`git describe --tags --abbrev=0`
echo "Retrieved VERSION from 'git describe'. Make sure this is correct :"
echo $VERSION
if [ "$nonInteractive" = false ] ; then
  read -p "(Press enter to continue)"
fi

echo "Publishing to NPM..."
if [ "$nonInteractive" = false ] ; then
  read -p "(Press enter to continue)"
fi

# Set the registry to the public NPM registry.
npm config set registry https://registry.npmjs.org

# Log in to the NPM registry using the access token.
echo "//registry.npmjs.org/:_authToken=${NPM_RELEASE_TOKEN}" >> ~/.npmrc
npm whoami || npm login

(cd .. && npm publish --dry-run="$dryRun")
