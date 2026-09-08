import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Scope to source. `npm ci` runs `prepare` -> `build`, so a populated
        // dist/ sits alongside src/ and vitest's default glob collected both:
        // 84 tests were reported as 168, half of them run against compiled
        // output nobody edits. A stale dist/ could pass while src/ was broken.
        include: ['src/**/*.{test,spec}.ts'],
    },
});
