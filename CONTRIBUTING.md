# Contributing

## Issues

With bugs and problems, please try to describe the issue as detailed as possible to help us reproduce it.

## Pull Requests

Before creating a pull request, please

- Make sure all guidelines are followed
- Make sure your branch is free of merge conflicts

## Development workflow

To get started with the project:

- Create the config file from the dist file `cp ./example/src/config.dist.ts ./example/src/config.ts` and update it with your Bitmovin Player license key
- Run `npm run bootstrap && npm run start:dev` in the root directory to install the required dependencies for each package, start the example app and the build scripts in the watch mode. Any changes you make in your library's JavaScript (TypeScript) code will be reflected in the example app without a rebuild.

## TypeScript Code Style

- Follow the `eslint` rules (`npm run lint`). They are enforced automatically via a pre-commit git hook.
- Public functions should be documented with a description that explains _what_ it does
- Every code block that does not obviously explain itself should be commented with an explanation of _why_ and _what_ it does

## Linting

### Typescript

- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [TypeScript](https://www.typescriptlang.org/)

We use [TypeScript](https://www.typescriptlang.org/) for type checking, [ESLint](https://eslint.org/) with [Prettier](https://prettier.io/) for linting and formatting the code, and [Jest](https://jestjs.io/) for testing.

Our pre-commit hooks verify that the linter will pass when committing. Make sure your code passes TypeScript and ESLint. Run the following to verify:

```sh
npm run lint
```

To fix lint errors, run the following:

```sh
npm run lint:fix
```

## Testing

Remember to add tests for your change if possible. Run the tests by:

```sh
npm run test
```

### Adding new tests

To add new tests:

1. Create a new file `*.test.ts` or `*.test.tsx` near the file you want to test
2. Implement the test suite using the Jest framework
3. Refer to the `BitmovinPlayer.test.tsx` as an example

## Scripts

The `package.json` file contains various scripts for common tasks:

- `npm run bootstrap`: setup the whole project by installing all dependencies
- `npm run start:dev`: start the example app and the build scripts in the watch mode
- `npm run build`: compile TypeScript files into `./dist`
- `npm run release`: release a new version of the package
- `npm run lint`: lint files with ESLint (includes Prettier)
- `npm run lint:fix`: fix lint errors
- `npm run test`: run the tests
