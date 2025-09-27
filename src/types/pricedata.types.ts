// THIS FILE IS GENERATED - DO NOT EDIT DIRECTLY

export enum CurrencyTypesEnum {
    "USD" = 'USD',
    "EUR" = 'EUR',
    "GBP" = 'GBP',
    "JPY" = 'JPY',
}

/** Currently supported currency codes by ThemeParks.wiki */
export type CurrencyTypes = keyof typeof CurrencyTypesEnum;

// Function to convert string to CurrencyTypesEnum
export function StringToCurrencyTypes(value: string): CurrencyTypesEnum {
    const lowerValue = value.toLowerCase();
    switch (lowerValue) {
        case 'usd':
            return CurrencyTypesEnum.USD;
        case 'eur':
            return CurrencyTypesEnum.EUR;
        case 'gbp':
            return CurrencyTypesEnum.GBP;
        case 'jpy':
            return CurrencyTypesEnum.JPY;
    }
    throw new Error('Unknown CurrencyTypes value: ' + value);
}

export type PriceData = {
    
    /** Numerical price amount. Always in the lowest denomination (e.g. cents for USD) */
    amount: number;
    
    /** Currency code */
    currency: CurrencyTypes;
    
    /** Formatted price string in human-readable format. E.g. $12.00 */
    formatted?: string;
}


// Runtime Schema Registration
import { registerTypeSchema } from "../type_register.js";

registerTypeSchema("CurrencyTypes", {
  "type": "string",
  "enum": [
    "USD",
    "EUR",
    "GBP",
    "JPY"
  ],
  "description": "Currently supported currency codes by ThemeParks.wiki"
});

registerTypeSchema("PriceData", {
  "type": "object",
  "required": [
    "amount",
    "currency"
  ],
  "properties": {
    "amount": {
      "type": "number",
      "description": "Numerical price amount. Always in the lowest denomination (e.g. cents for USD)"
    },
    "currency": {
      "$ref": "#/properties/CurrencyTypes",
      "description": "Currency code"
    },
    "formatted": {
      "type": "string",
      "description": "Formatted price string in human-readable format. E.g. $12.00"
    }
  }
});

