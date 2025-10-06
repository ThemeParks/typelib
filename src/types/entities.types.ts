// THIS FILE IS GENERATED - DO NOT EDIT DIRECTLY

export enum LanguageCodeEnum {
    "en" = 'en',
    "en-gb" = 'en-gb',
    "en-us" = 'en-us',
    "de" = 'de',
    "fr" = 'fr',
    "es" = 'es',
    "it" = 'it',
    "nl" = 'nl',
    "ja" = 'ja',
    "ko" = 'ko',
    "zh" = 'zh',
}

/** Supported language codes for ThemeParks.wiki */
export type LanguageCode = keyof typeof LanguageCodeEnum;

// Function to convert string to LanguageCodeEnum
export function StringToLanguageCode(value: string): LanguageCodeEnum {
    const lowerValue = value.toLowerCase();
    switch (lowerValue) {
        case 'en':
            return LanguageCodeEnum.en;
        case 'en-gb':
            return LanguageCodeEnum["en-gb"];
        case 'en-us':
            return LanguageCodeEnum["en-us"];
        case 'de':
            return LanguageCodeEnum.de;
        case 'fr':
            return LanguageCodeEnum.fr;
        case 'es':
            return LanguageCodeEnum.es;
        case 'it':
            return LanguageCodeEnum.it;
        case 'nl':
            return LanguageCodeEnum.nl;
        case 'ja':
            return LanguageCodeEnum.ja;
        case 'ko':
            return LanguageCodeEnum.ko;
        case 'zh':
            return LanguageCodeEnum.zh;
    }
    throw new Error('Unknown LanguageCode value: ' + value);
}

/** A string with multiple language translations */
export interface MultilangString extends Record<LanguageCode, string> {}

/** A string that may be localised or a simple string */
export type LocalisedString = MultilangString | string;

export enum EntityTypeEnum {
    "DESTINATION" = 'DESTINATION',
    "PARK" = 'PARK',
    "ATTRACTION" = 'ATTRACTION',
    "RESTAURANT" = 'RESTAURANT',
    "SHOW" = 'SHOW',
    "HOTEL" = 'HOTEL',
}

/** Possible types of entity in ThemeParks.wiki */
export type EntityType = keyof typeof EntityTypeEnum;

// Function to convert string to EntityTypeEnum
export function StringToEntityType(value: string): EntityTypeEnum {
    const lowerValue = value.toLowerCase();
    switch (lowerValue) {
        case 'destination':
            return EntityTypeEnum.DESTINATION;
        case 'park':
            return EntityTypeEnum.PARK;
        case 'attraction':
            return EntityTypeEnum.ATTRACTION;
        case 'restaurant':
            return EntityTypeEnum.RESTAURANT;
        case 'show':
            return EntityTypeEnum.SHOW;
        case 'hotel':
            return EntityTypeEnum.HOTEL;
    }
    throw new Error('Unknown EntityType value: ' + value);
}

export enum AttractionTypeEnum {
    "UNKNOWN" = 'UNKNOWN',
    "RIDE" = 'RIDE',
    "SHOW" = 'SHOW',
    "TRANSPORT" = 'TRANSPORT',
    "PARADE" = 'PARADE',
    "MEET_AND_GREET" = 'MEET_AND_GREET',
    "OTHER" = 'OTHER',
}

/** Possible types of attraction in ThemeParks.wiki */
export type AttractionType = keyof typeof AttractionTypeEnum;

// Function to convert string to AttractionTypeEnum
export function StringToAttractionType(value: string): AttractionTypeEnum {
    const lowerValue = value.toLowerCase();
    switch (lowerValue) {
        case 'unknown':
            return AttractionTypeEnum.UNKNOWN;
        case 'ride':
            return AttractionTypeEnum.RIDE;
        case 'show':
            return AttractionTypeEnum.SHOW;
        case 'transport':
            return AttractionTypeEnum.TRANSPORT;
        case 'parade':
            return AttractionTypeEnum.PARADE;
        case 'meet_and_greet':
            return AttractionTypeEnum.MEET_AND_GREET;
        case 'other':
            return AttractionTypeEnum.OTHER;
    }
    throw new Error('Unknown AttractionType value: ' + value);
}

export type EntityLocation = {
    
    /** Latitude coordinate of the entity location */
    latitude?: number | null;
    
    /** Longitude coordinate of the entity location */
    longitude?: number | null;
}

export type TagData = {
    
    /** Tag identifier */
    tag: string;
    
    /** Human readable tag name */
    tagName: string;
    
    /** Unique identifier */
    id?: string;
    
    /** Tag value - can be string, number or object */
    value?: any;
}

export type Entity = {
    
    /** Unique entity identifier */
    id: string;
    
    /** Entity name */
    name: LocalisedString;
    
    /** Type of entity */
    entityType: EntityType;
    
    /** Parent entity identifier, must always be set when entityType is not DESTINATION */
    parentId?: string | null;
    
    /** Destination identifier, must always be set when entityType is not DESTINATION */
    destinationId?: string | null;
    
    /** Park identifier, must be set if any parent entity in the hierarchy is a park */
    parkId?: string | null;
    
    /** Entity timezone */
    timezone: string;
    
    /** Entity location coordinates */
    location?: EntityLocation;
    
    /** Array of tags associated with the entity */
    tags?: TagData[];
}


// Runtime Schema Registration
import { registerTypeSchema } from "../type_register.js";

registerTypeSchema("LanguageCode", {
  "type": "string",
  "enum": [
    "en",
    "en-gb",
    "en-us",
    "de",
    "fr",
    "es",
    "it",
    "nl",
    "ja",
    "ko",
    "zh"
  ],
  "description": "Supported language codes for ThemeParks.wiki"
});

registerTypeSchema("MultilangString", {
  "type": "object",
  "description": "A string with multiple language translations",
  "propertyNames": {
    "$ref": "#/properties/LanguageCode"
  },
  "additionalProperties": {
    "type": "string",
    "description": "The string in the specified language"
  }
});

registerTypeSchema("LocalisedString", {
  "oneOf": [
    {
      "$ref": "#/properties/MultilangString"
    },
    {
      "type": "string",
      "description": "A simple string, no localisation. English where available, or native language if not."
    }
  ],
  "description": "A string that may be localised or a simple string"
});

registerTypeSchema("EntityType", {
  "type": "string",
  "enum": [
    "DESTINATION",
    "PARK",
    "ATTRACTION",
    "RESTAURANT",
    "SHOW",
    "HOTEL"
  ],
  "description": "Possible types of entity in ThemeParks.wiki"
});

registerTypeSchema("AttractionType", {
  "type": "string",
  "enum": [
    "UNKNOWN",
    "RIDE",
    "SHOW",
    "TRANSPORT",
    "PARADE",
    "MEET_AND_GREET",
    "OTHER"
  ],
  "description": "Possible types of attraction in ThemeParks.wiki"
});

registerTypeSchema("EntityLocation", {
  "type": "object",
  "properties": {
    "latitude": {
      "type": "number",
      "description": "Latitude coordinate of the entity location",
      "nullable": true
    },
    "longitude": {
      "type": "number",
      "description": "Longitude coordinate of the entity location",
      "nullable": true
    }
  }
});

registerTypeSchema("TagData", {
  "type": "object",
  "required": [
    "tag",
    "tagName"
  ],
  "properties": {
    "tag": {
      "type": "string",
      "description": "Tag identifier"
    },
    "tagName": {
      "type": "string",
      "description": "Human readable tag name"
    },
    "id": {
      "type": "string",
      "description": "Unique identifier"
    },
    "value": {
      "description": "Tag value - can be string, number or object"
    }
  }
});

registerTypeSchema("Entity", {
  "type": "object",
  "required": [
    "id",
    "name",
    "entityType",
    "timezone"
  ],
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique entity identifier"
    },
    "name": {
      "$ref": "#/properties/LocalisedString",
      "description": "Entity name"
    },
    "entityType": {
      "$ref": "#/properties/EntityType",
      "description": "Type of entity"
    },
    "parentId": {
      "type": "string",
      "nullable": true,
      "description": "Parent entity identifier, must always be set when entityType is not DESTINATION"
    },
    "destinationId": {
      "type": "string",
      "nullable": true,
      "description": "Destination identifier, must always be set when entityType is not DESTINATION"
    },
    "parkId": {
      "type": "string",
      "nullable": true,
      "description": "Park identifier, must be set if any parent entity in the hierarchy is a park"
    },
    "timezone": {
      "type": "string",
      "description": "Entity timezone"
    },
    "location": {
      "$ref": "#/properties/EntityLocation",
      "description": "Entity location coordinates"
    },
    "tags": {
      "type": "array",
      "items": {
        "$ref": "#/properties/TagData"
      },
      "description": "Array of tags associated with the entity"
    }
  }
});

