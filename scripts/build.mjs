// Builds the library packages: one ESM file per source module (esbuild) plus .d.ts files (tsc).
import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';

const packages = [
  { dir: 'packages/core' },
  { dir: 'packages/react' },
];

for (const { dir } of packages) {
  rmSync(`${dir}/dist`, { recursive: true, force: true });
  const entryPoints = readdirSync(`${dir}/src`, { recursive: true })
    .map(String)
    .filter((f) => /\.tsx?$/.test(f) && !f.includes('.test.'))
    .map((f) => `${dir}/src/${f}`);
  await build({
    entryPoints, outdir: `${dir}/dist`, outbase: `${dir}/src`, format: 'esm', platform: 'browser',
    target: 'es2022', bundle: false, minify: false, jsx: 'automatic', logLevel: 'warning',
  });
  // esbuild keeps import specifiers as written; sources import './x.js' so the output resolves.
  execSync(`npx tsc -p ${dir}`, { stdio: 'inherit' });
  console.log(`built ${dir}`);
}
