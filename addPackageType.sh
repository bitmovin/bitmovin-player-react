#!/bin/bash

# Add the package type to the dist to ensure they are recognized correctly by the consuming projects (CJS and ESM).
# https://www.sensedeep.com/blog/posts/2021/how-to-create-single-source-npm-module.html

cat >dist/cjs/package.json <<!EOF
{
    "type": "commonjs"
}
!EOF

cat >dist/esm/package.json <<!EOF
{
    "type": "module"
}
!EOF
