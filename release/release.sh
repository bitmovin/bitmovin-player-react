#!/bin/bash

if [ -z "$NPM_TOKEN" ]; then
    read -s -p "Enter your npm access token: " NPM_TOKEN
    echo
fi

# Check if we are on the main branch.
if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
    echo "You must be on the main branch to publish to npm"
    exit 1
fi

VERSION=`git describe --tags --abbrev=0`
echo "Retrieved VERSION from 'git describe'. Make sure this is correct :"
echo $VERSION
read -p "(Press enter to continue)"

echo "Publishing to NPM..."
read -p "(Press enter to continue)"

# Set the registry to the public npm registry.
npm config set registry https://registry.npmjs.org/

# Log in to the npm registry using the access token.
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >> ~/.npmrc
npm whoami || npm login

# Test the publishing process.
$(cd .. && npm publish --dry-run=true)

read -p "Does the above look correct? (Press enter to continue)"

# Publish the package to the npm registry.
$(cd .. && npm publish)
