/**
 * Invariants the two registries depend on.
 *
 * This package publishes twice from one tree: npm builds `dist/` from
 * `package.json`, JSR serves `src/` from `jsr.json`. Nothing made the two
 * manifests agree, and they have drifted twice already — 1.1.3/1.1.2 and
 * 1.1.5/1.1.4 — each time shipping a change to npm under a version number
 * JSR never had.
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');

const read = (name: string) => JSON.parse(readFileSync(resolve(root, name), 'utf8'));

const pkg = read('package.json');
const jsr = read('jsr.json');

describe('package.json and jsr.json', () => {
    it('publish the same version to both registries', () => {
        expect(jsr.version).toBe(pkg.version);
    });

    it('publish under the same package name', () => {
        expect(jsr.name).toBe(pkg.name);
    });

    it('expose the same entry points', () => {
        expect(Object.keys(jsr.exports).sort()).toEqual(Object.keys(pkg.exports).sort());
    });
});

describe('jsr.json exports', () => {
    // JSR serves these paths straight from the repo, with no build step to
    // fail first, so a renamed file becomes a broken published package.
    it.each(Object.entries<string>({ ...(jsr.exports as Record<string, string>) }))(
        'resolves %s to a file that exists',
        (_entry, path) => {
            expect(existsSync(resolve(root, path))).toBe(true);
        },
    );

    it('excludes the test directory from what it publishes', () => {
        expect(jsr.publish.exclude).toContain('src/__tests__');
    });
});

describe('provenance metadata', () => {
    // `npm publish --provenance` asks sigstore to attest WHICH repository built
    // the tarball, and the registry then refuses the upload unless
    // package.json's own `repository.url` agrees with that attestation.
    //
    // package.json had no `repository` field at all, so the first real release
    // failed after signing:
    //
    //   422 Unprocessable Entity - PUT .../@themeparks%2ftypelib
    //   Error verifying sigstore provenance bundle: Failed to validate
    //   repository information: package.json: "repository.url" is "",
    //   expected to match "https://github.com/ThemeParks/typelib"
    //
    // Nothing could have caught that before a tag push: every other guard in
    // release.yml runs against the tree, and this one is enforced by the
    // registry at the moment of upload. Hence a test, so the next person finds
    // out from a red suite rather than from a half-finished release.

    it('names the repository, which provenance verification requires', () => {
        expect(pkg.repository).toBeDefined();
        expect(pkg.repository.url, 'an empty url is what failed the release').toBeTruthy();
    });

    it('names the repository provenance will actually attest', () => {
        // The registry compares against the GitHub repo the workflow ran in.
        // Any other value — a fork, a renamed org, a typo — fails the same way,
        // so the expected string is written out rather than derived.
        const url: string = pkg.repository.url;
        const normalised = url.replace(/^git\+/, '').replace(/\.git$/, '');

        expect(normalised).toBe('https://github.com/ThemeParks/typelib');
    });

    it('uses a form npm can normalise', () => {
        // npm accepts shorthand ("github:owner/repo") but the registry compares
        // the normalised https form. An explicit git+https url leaves nothing
        // to interpretation.
        expect(pkg.repository.type).toBe('git');
        expect(pkg.repository.url).toMatch(/^git\+https:\/\//);
    });
});
