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
4. Publishing the GitHub release starts `.github/workflows/publish.yml`, which publishes `topographic` and then `topographic-react` to npm once the maintainer approves its run in the `npm` environment.
   It uses npm trusted publishing, so there is no npm token, and it skips a version npm already has, so a failed run can be re-run.
   To publish an existing release again, run the workflow by hand with its tag.
5. Check again that every part names the new version.

## Roles in a release

This section names who does each step.

- The agent picks the version, writes the changelog, opens the release pull request, makes the tag and publishes the GitHub release, then checks that npm shows the new version once the workflow is done.
- The maintainer approves the version, the merge and the workflow's `npm` environment run.
  An agent never runs `npm login` or `npm publish` itself.
