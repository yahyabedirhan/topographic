# Releasing

This page explains how Topographic releases a new version, from choosing the version number to checking that the release is complete.
Everyone who releases the project reads it, people and agents alike.
Read it before you start a release, and again after you merge a pull request that changes the version, because the release is not finished until every step below is done.
The [`/set-up-project`](https://github.com/yahyabedirhan/skills/tree/main/skills/set-up-project) skill wrote this page.
It started from the release rules that the maintainer shares across all of their projects, and added what this project does in its own way.
When this page and the shared rules disagree, follow this page, and the next `/set-up-project` run brings the two back in line.

## What a release ships

This section names what a Topographic release puts out, so you know which parts must all name the new version.

- The npm package [`topographic`](https://www.npmjs.com/package/topographic), from `packages/core`.
- The npm package [`topographic-react`](https://www.npmjs.com/package/topographic-react), from `packages/react`.
  It depends on `topographic`, so the two packages always share one version.
- A tag, `v<version>`, and a [GitHub release](https://github.com/yahyabedirhan/topographic/releases) for that tag.
- A section in `CHANGELOG.md`.

The playground in `apps/playground` and the root `package.json` are marked `"private": true`.
Neither is published, and neither holds a version.

## Version files

This section lists every file a release changes to set the new version, so no file is left on the old one.

- `packages/core/package.json` holds the version in `"version"`.
- `packages/react/package.json` holds the version in `"version"`, and the range of its `topographic` dependency in `"dependencies"`, such as `"^0.7.0"`.
- `apps/playground/package.json` holds the ranges of `topographic` and `topographic-react` in `"dependencies"`.
- `package-lock.json` follows the files above.
  Run `npm install` after you change them, and commit the lockfile with them.

## Release order

This section is the list of steps every release runs, in this order, so that npm never receives a version that has no tag and no GitHub release.

0. Start by catching up.
   Read what each part of the project says the newest version is:

   ```sh
   head -20 CHANGELOG.md | grep -m1 '^## [0-9]'
   git fetch --tags origin && git describe --tags --abbrev=0 origin/main
   gh release view --json tagName -q .tagName
   npm view topographic version
   npm view topographic-react version
   ```

   When one part is behind the others, finish that version first, from the first step it is missing, before you start a new version.
   A version that is already on npm gets its tag and GitHub release on the commit that set that version.
1. Open one pull request that sets the new version and the changelog.
   Choose the version from the commits since the last tag, as 'Version rule' below says, set it in every file that 'Version files' lists, and rename `## Unreleased` to `## <version> (<YYYY-MM-DD>)`.
2. Merge the pull request once the maintainer approves it.
3. Tag the merged commit as `v<version>`, and make a GitHub release for that tag with the changelog section as its notes.
   'Tag and GitHub release' below has the command.
4. Publish both packages to npm, as 'npm publishing' below says.
   The maintainer runs the publish.
5. Check the release by running the reads from step 0 again.
   Each read names the new version.

A version is complete when every part names it: the top `CHANGELOG.md` section, the version files, the tag, the latest GitHub release and both packages on npm.
A release ends at step 5, not at the merge or the publish.

## Version rule

This section says how to pick the next version number, so that users can tell from the number what kind of change it holds.

List the commits since the last tag first:

```sh
git log $(git describe --tags --abbrev=0)..origin/main --oneline
```

- Before version 1.0, a new feature or a breaking change raises the middle number and resets the last number to zero.
  Any other change raises the last number.
- From version 1.0, a breaking change raises the first number.
- Tell the maintainer the version before anything else, so they can stop the release.
- A published version is never changed or reused.
  When a published version has a mistake, release a new patch version that fixes it.

## Changelog

This section explains how `CHANGELOG.md` is kept, so it is ready when a release starts.

- The changelog is `CHANGELOG.md` at the root of the repository, with the newest version first, written for the people who use the library and the playground.
- Each pull request that makes a change users can see adds its line under `## Unreleased` at the top of the changelog.
  Add that heading above the newest version when it is missing.
- The release pull request turns `## Unreleased` into `## <version> (<YYYY-MM-DD>)`, such as `## 0.7.0 (2026-10-22)`.
- The changelog section, without its heading, is the GitHub release's notes.

## Tag and GitHub release

This section explains how each version is marked on GitHub, so anyone can find what a version contains.

- Every version gets a tag, `v<version>`, on the merged commit of its release pull request.
- Every tag gets a GitHub release, titled `<version>: <what the version is about>`, such as `0.7.0: blending between scenes`.
- One command makes both, and creates the tag when it does not exist yet:

  ```sh
  gh release create v<version> --target <merged commit> --title '<version>: <what the version is about>' --notes-file <changelog section>
  ```

- No workflow makes tags or releases in this repository.
  The only workflow, `.github/workflows/pages.yml`, redirects the old GitHub Pages address.

## npm publishing

This section explains how the two packages reach npm, and why the maintainer runs that step.

npm asks for a two-factor code on every publish, and only the maintainer has that code, so the agent prepares everything and the maintainer runs `npm login` and `npm publish`.
An agent never runs either command.

The agent prepares a clean checkout of the tag:

```sh
git checkout v<version>
npm ci
npm run build:packages
npm run typecheck
npm test
npm pack --dry-run -w packages/core
npm pack --dry-run -w packages/react
```

`npm run build:packages` must run before the publish, because neither package has a `prepack` or `prepublishOnly` script and each one ships only its `dist` folder.
`npm pack --dry-run` shows the files each package would ship.

The maintainer then publishes `topographic` first, because `topographic-react` depends on it:

```sh
npm login
npm publish -w packages/core
npm publish -w packages/react
```

Both packages set `"publishConfig": { "access": "public" }`, so the publish needs no access flag.
Step 5 checks each package with `npm view <package> version`.

## Roles in a release

This section names who does each step, so nobody waits on a step that is theirs.

- The agent picks the version, writes the changelog, opens the release pull request, makes the tag and the GitHub release, prepares the checkout for the publish, and runs the checks.
- The maintainer approves the version and the merge, and runs `npm login` and `npm publish` with their two-factor code.
