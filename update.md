# Update Instructions

## Node.js Major Version Update

1. Update the oldest major version of Node.js in the project by changing `engines.node` in `package.json` to the new version. You may also need to install the new version of Node.js.
2. Update `env.NODE_VERSION` in `.github/workflows/{ci,cd}.yml` to the same version.

## Package Update

There are two ways to update the dependencies in the project. In both cases, you should run `npm install` after updating the dependencies.

### Passive Update

Run `npm update`. This won't update the `package.json` file, but will update the `package-lock.json` file to the latest versions of the dependencies that satisfy the version ranges specified in `package.json`.

### Aggressive Update

Run `npx npm-check-updates -u`. This will update the `package.json` file to the latest versions of the dependencies.

## Self Version Update

Run `npm version {major|minor|patch}` to increment the version in `package.json`, `package-lock.json`, create a git commit and create a git tag. The tag name will be `v{major}.{minor}.{patch}`, which triggers the GitHub Actions workflow to deploy the new version to GitHub Pages.
