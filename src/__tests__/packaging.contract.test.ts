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
