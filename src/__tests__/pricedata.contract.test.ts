import { describe, it, expect } from 'vitest';
import { getTypeSchema } from '../type_register.js';
import type { PriceData } from '../types/pricedata.types.js';
import '../types/index.js';

// Contract tests for the shipped PriceData type.
//
// Regression cover for the unknown-price hole: `amount` used to be a
// non-nullable `number`, so the only representable value for "this costs
// money but the provider does not publish a price" was `0` — a factual
// claim that the item is free. `amount` is now `number | null`.

describe('PriceData unknown-price contract', () => {
    it('accepts null for an unknown amount, keeping the currency', () => {
        const unknownPrice: PriceData = { currency: 'JPY', amount: null };

        expect(unknownPrice.amount).toBeNull();
        expect(unknownPrice.currency).toBe('JPY');
    });

    it('keeps 0 meaning genuinely free, distinct from unknown', () => {
        const free: PriceData = { currency: 'USD', amount: 0 };
        const unknown: PriceData = { currency: 'USD', amount: null };

        expect(free.amount).toBe(0);
        expect(free.amount).not.toBe(unknown.amount);
    });

    it('still requires the amount key to be present', () => {
        // @ts-expect-error amount is required; unknown must be an explicit null
        const missing: PriceData = { currency: 'USD' };

        expect(missing).toBeDefined();
    });
});

describe('PriceData runtime schema', () => {
    it('publishes amount as number | null', () => {
        const schema = getTypeSchema('PriceData');

        expect(schema.properties.amount.type).toEqual(['number', 'null']);
    });

    it('keeps amount in required, so unknown is an explicit null not an absent key', () => {
        const schema = getTypeSchema('PriceData');

        expect(schema.required).toContain('amount');
        expect(schema.required).toContain('currency');
    });
});
