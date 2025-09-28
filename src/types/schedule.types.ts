// THIS FILE IS GENERATED - DO NOT EDIT DIRECTLY

export enum ScheduleTypeEnum {
    "OPERATING" = 'OPERATING',
    "TICKETED_EVENT" = 'TICKETED_EVENT',
    "PRIVATE_EVENT" = 'PRIVATE_EVENT',
    "EXTRA_HOURS" = 'EXTRA_HOURS',
    "INFO" = 'INFO',
}

/** Types of schedule entries for parks */
export type ScheduleType = keyof typeof ScheduleTypeEnum;

// Function to convert string to ScheduleTypeEnum
export function StringToScheduleType(value: string): ScheduleTypeEnum {
    const lowerValue = value.toLowerCase();
    switch (lowerValue) {
        case 'operating':
            return ScheduleTypeEnum.OPERATING;
        case 'ticketed_event':
            return ScheduleTypeEnum.TICKETED_EVENT;
        case 'private_event':
            return ScheduleTypeEnum.PRIVATE_EVENT;
        case 'extra_hours':
            return ScheduleTypeEnum.EXTRA_HOURS;
        case 'info':
            return ScheduleTypeEnum.INFO;
    }
    throw new Error('Unknown ScheduleType value: ' + value);
}

/** Represents a single schedule entry */
export type ScheduleEntry = {
    
    /** The date of the schedule entry, YYYY-MM-DD format */
    date: string;
    
    /** Type of schedule entry e.g. OPERATING, EXTRA_HOURS, etc. */
    type: ScheduleType;
    
    /** Optional description of the schedule entry */
    description?: string;
    
    /** Opening time for this schedule entry */
    openingTime: string;
    
    /** Closing time for this schedule entry */
    closingTime: string;
}

/** Represents the schedule for a specific park entity */
export type EntitySchedule = {
    
    /** Identifier of the park entity this schedule belongs to */
    id: string;
    
    /** Array of schedule entries for the park */
    schedule: ScheduleEntry[];
}


// Runtime Schema Registration
import { registerTypeSchema } from "../type_register.js";

registerTypeSchema("ScheduleType", {
  "type": "string",
  "enum": [
    "OPERATING",
    "TICKETED_EVENT",
    "PRIVATE_EVENT",
    "EXTRA_HOURS",
    "INFO"
  ],
  "description": "Types of schedule entries for parks"
});

registerTypeSchema("ScheduleEntry", {
  "type": "object",
  "required": [
    "date",
    "type",
    "openingTime",
    "closingTime"
  ],
  "properties": {
    "date": {
      "type": "string",
      "description": "The date of the schedule entry, YYYY-MM-DD format",
      "format": "date",
      "example": "1992-04-12"
    },
    "type": {
      "$ref": "#/properties/ScheduleType",
      "description": "Type of schedule entry e.g. OPERATING, EXTRA_HOURS, etc."
    },
    "description": {
      "type": "string",
      "description": "Optional description of the schedule entry"
    },
    "openingTime": {
      "type": "string",
      "format": "date-time",
      "description": "Opening time for this schedule entry",
      "example": "1992-04-12T09:00:00-07:00"
    },
    "closingTime": {
      "type": "string",
      "format": "date-time",
      "description": "Closing time for this schedule entry",
      "example": "1992-04-12T17:00:00-07:00"
    }
  },
  "description": "Represents a single schedule entry"
});

registerTypeSchema("EntitySchedule", {
  "type": "object",
  "required": [
    "id",
    "schedule"
  ],
  "properties": {
    "id": {
      "type": "string",
      "description": "Identifier of the park entity this schedule belongs to"
    },
    "schedule": {
      "type": "array",
      "items": {
        "$ref": "#/properties/ScheduleEntry"
      },
      "description": "Array of schedule entries for the park"
    }
  },
  "description": "Represents the schedule for a specific park entity"
});

