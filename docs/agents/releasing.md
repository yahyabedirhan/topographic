# Releasing

This page explains how Topographic releases a new version.
Read it before you start a release, and after you merge a pull request that changes the version, because a release is finished only when every step below is done.
The [`/set-up-project`](https://github.com/yahyabedirhan/skills/tree/main/skills/set-up-project) skill wrote it from the maintainer's shared release rules.

## What a release ships

This section names the parts that must all show the new version.

- The npm packages [`topographic`](https://www.npmjs.com/package/topographic) from `packages/core` and [`topographic-react`](https://www.npmjs.com/package/topographic-react) from `packages/react`, which always share one version.
- A tag, `v<version>`, and a [GitHub release](https://github.com/yahyabedirhan/topographic/releases) for it.
- A section in `CHANGELOG.md`.

## Release order

This section lists the steps of every release, in order, so that npm never gets a version without a tag and a GitHub release.

0. Check that the changelog, the latest tag, the latest GitHub release and npm all name the same version, and finish any version that is behind first.
1. Open one pull request that sets the version in both packages' `package.json` and renames `## Unreleased` in `CHANGELOG.md` to `## <version> (<YYYY-MM-DD>)`.
   Before 1.0, a feature or a breaking change raises the middle number, and anything else raises the last number.
2. Merge it once the maintainer approves.
3. Tag the merged commit as `v<version>` and make its GitHub release, with the changelog section as the notes.
4. Publish both packages to npm, `topographic` first, as 'Roles in a release' below says.
5. Check again that every part names the new version.

## Roles in a release

This section names who does each step.

- The agent picks the version, writes the changelog, opens the release pull request, makes the tag and the GitHub release, and prepares a clean, built checkout of the tag for the publish.
- The maintainer approves the version and the merge, and runs `npm login` and `npm publish` himself, because npm asks for his two-factor code.
  An agent never runs either command.
