// THIS FILE IS GENERATED - DO NOT EDIT DIRECTLY

import { PriceData } from './pricedata.types.js';

export enum LiveStatusTypeEnum {
    "OPERATING" = 'OPERATING',
    "DOWN" = 'DOWN',
    "CLOSED" = 'CLOSED',
    "REFURBISHMENT" = 'REFURBISHMENT',
}

/** Current operating status of an entity */
export type LiveStatusType = keyof typeof LiveStatusTypeEnum;

// Function to convert string to LiveStatusTypeEnum
export function StringToLiveStatusType(value: string): LiveStatusTypeEnum {
    const lowerValue = value.toLowerCase();
    switch (lowerValue) {
        case 'operating':
            return LiveStatusTypeEnum.OPERATING;
        case 'down':
            return LiveStatusTypeEnum.DOWN;
        case 'closed':
            return LiveStatusTypeEnum.CLOSED;
        case 'refurbishment':
            return LiveStatusTypeEnum.REFURBISHMENT;
    }
    throw new Error('Unknown LiveStatusType value: ' + value);
}

export enum ReturnTimeStateEnum {
    "AVAILABLE" = 'AVAILABLE',
    "TEMP_FULL" = 'TEMP_FULL',
    "FINISHED" = 'FINISHED',
}

/** State of return time availability */
export type ReturnTimeState = keyof typeof ReturnTimeStateEnum;

// Function to convert string to ReturnTimeStateEnum
export function StringToReturnTimeState(value: string): ReturnTimeStateEnum {
    const lowerValue = value.toLowerCase();
    switch (lowerValue) {
        case 'available':
            return ReturnTimeStateEnum.AVAILABLE;
        case 'temp_full':
            return ReturnTimeStateEnum.TEMP_FULL;
        case 'finished':
            return ReturnTimeStateEnum.FINISHED;
    }
    throw new Error('Unknown ReturnTimeState value: ' + value);
}

export enum BoardingGroupStateEnum {
    "AVAILABLE" = 'AVAILABLE',
    "PAUSED" = 'PAUSED',
    "CLOSED" = 'CLOSED',
}

/** State of boarding group availability */
export type BoardingGroupState = keyof typeof BoardingGroupStateEnum;

// Function to convert string to BoardingGroupStateEnum
export function StringToBoardingGroupState(value: string): BoardingGroupStateEnum {
    const lowerValue = value.toLowerCase();
    switch (lowerValue) {
        case 'available':
            return BoardingGroupStateEnum.AVAILABLE;
        case 'paused':
            return BoardingGroupStateEnum.PAUSED;
        case 'closed':
            return BoardingGroupStateEnum.CLOSED;
    }
    throw new Error('Unknown BoardingGroupState value: ' + value);
}

export type LiveQueue = {
    
    /** Standard queue type for most attractions. Wait in line for attraction, no additional cost. */
    STANDBY?: {
    
    /** Current standby wait time in minutes */
    waitTime?: number;
};
    
    /** Single Rider queue type for attractions that offer it. Usually a shorter wait time, but you may be separated from your party. No additional cost. */
    SINGLE_RIDER?: {
    
    /** Current single rider wait time in minutes */
    waitTime: number | null;
};
    
    /** Return Time queue type for attractions that offer it. You get a return time to come back and ride the attraction later, instead of waiting in a physical line. No additional cost. */
    RETURN_TIME?: {
    
    /** State of return time availability */
    state: ReturnTimeState;
    
    /** Start time of return window */
    returnStart: string | null;
    
    /** End time of return window */
    returnEnd: string | null;
};
    
    /** Paid Return Time queue type for attractions that offer it. You pay an additional cost to get a return time to come back and ride the attraction later, instead of waiting in a physical line. */
    PAID_RETURN_TIME?: {
    
    /** State of return time availability */
    state: ReturnTimeState;
    
    /** Start time of return window */
    returnStart: string | null;
    
    /** End time of return window */
    returnEnd: string | null;
    
    /** Price information for paid return time */
    price: PriceData;
};
    
    /** Boarding Group queue type for attractions that offer it. You get allocated a boarding group number and wait until your group is called. No additional cost. */
    BOARDING_GROUP?: {
    
    /** State of boarding group availability */
    allocationStatus: BoardingGroupState;
    
    /** Current boarding group start number */
    currentGroupStart: number | null;
    
    /** Current boarding group end number */
    currentGroupEnd: number | null;
    
    /** Next boarding group allocation time */
    nextAllocationTime: string | null;
    
    /** Estimated wait time in minutes */
    estimatedWait: number | null;
};
    
    /** Paid Standby queue type for attractions that offer it. You pay an additional cost to use a separate standby line, usually with a shorter wait time. */
    PAID_STANDBY?: {
    
    /** Current paid standby wait time in minutes */
    waitTime: number | null;
};
}

/** Time entry for shows or attraction operating hours */
export type LiveTimeSlot = {
    
    /** Type of time entry */
    type: string;
    
    /** Start time */
    startTime?: string | null;
    
    /** End time */
    endTime?: string | null;
}

/** Dining availability information for restaurants */
export type DiningAvailability = {
    
    /** Available party size */
    partySize?: number | null;
    
    /** Current wait time in minutes */
    waitTime?: number | null;
}

export type LiveData = {
    
    /** Entity identifier */
    id: string;
    
    /** Current operating status of the entity */
    status?: LiveStatusType;
    
    /** Current queue information for entities with queues (e.g. attractions) */
    queue?: LiveQueue;
    
    /** Array of showtime entries for entities that have scheduled showtimes (e.g. shows) */
    showtimes?: LiveTimeSlot[];
    
    /** Array of operating hours entries for entities that have specific operating hours (e.g. parks, restaurants) */
    operatingHours?: LiveTimeSlot[];
    
    /** Array of dining availability entries for entities that have dining options (e.g. restaurants) */
    diningAvailability?: DiningAvailability[];
}


// Runtime Schema Registration
import { registerTypeSchema } from "../type_register.js";

registerTypeSchema("LiveStatusType", {
  "type": "string",
  "enum": [
    "OPERATING",
    "DOWN",
    "CLOSED",
    "REFURBISHMENT"
  ],
  "description": "Current operating status of an entity"
});

registerTypeSchema("ReturnTimeState", {
  "type": "string",
  "enum": [
    "AVAILABLE",
    "TEMP_FULL",
    "FINISHED"
  ],
  "description": "State of return time availability"
});

registerTypeSchema("BoardingGroupState", {
  "type": "string",
  "enum": [
    "AVAILABLE",
    "PAUSED",
    "CLOSED"
  ],
  "description": "State of boarding group availability"
});

registerTypeSchema("LiveQueue", {
  "type": "object",
  "properties": {
    "STANDBY": {
      "type": "object",
      "properties": {
        "waitTime": {
          "type": "number",
          "description": "Current standby wait time in minutes"
        }
      },
      "description": "Standard queue type for most attractions. Wait in line for attraction, no additional cost."
    },
    "SINGLE_RIDER": {
      "type": "object",
      "required": [
        "waitTime"
      ],
      "properties": {
        "waitTime": {
          "type": "number",
          "nullable": true,
          "description": "Current single rider wait time in minutes"
        }
      },
      "description": "Single Rider queue type for attractions that offer it. Usually a shorter wait time, but you may be separated from your party. No additional cost."
    },
    "RETURN_TIME": {
      "type": "object",
      "required": [
        "state",
        "returnStart",
        "returnEnd"
      ],
      "properties": {
        "state": {
          "$ref": "#/properties/ReturnTimeState",
          "description": "State of return time availability"
        },
        "returnStart": {
          "type": "string",
          "format": "date-time",
          "nullable": true,
          "description": "Start time of return window"
        },
        "returnEnd": {
          "type": "string",
          "format": "date-time",
          "nullable": true,
          "description": "End time of return window"
        }
      },
      "description": "Return Time queue type for attractions that offer it. You get a return time to come back and ride the attraction later, instead of waiting in a physical line. No additional cost."
    },
    "PAID_RETURN_TIME": {
      "type": "object",
      "required": [
        "state",
        "returnStart",
        "returnEnd",
        "price"
      ],
      "properties": {
        "state": {
          "$ref": "#/properties/ReturnTimeState",
          "description": "State of return time availability"
        },
        "returnStart": {
          "type": "string",
          "format": "date-time",
          "nullable": true,
          "description": "Start time of return window"
        },
        "returnEnd": {
          "type": "string",
          "format": "date-time",
          "nullable": true,
          "description": "End time of return window"
        },
        "price": {
          "$ref": "#/properties/PriceData",
          "description": "Price information for paid return time"
        }
      },
      "description": "Paid Return Time queue type for attractions that offer it. You pay an additional cost to get a return time to come back and ride the attraction later, instead of waiting in a physical line."
    },
    "BOARDING_GROUP": {
      "type": "object",
      "required": [
        "allocationStatus",
        "currentGroupStart",
        "currentGroupEnd",
        "nextAllocationTime",
        "estimatedWait"
      ],
      "properties": {
        "allocationStatus": {
          "$ref": "#/properties/BoardingGroupState",
          "description": "State of boarding group availability"
        },
        "currentGroupStart": {
          "type": "number",
          "nullable": true,
          "description": "Current boarding group start number"
        },
        "currentGroupEnd": {
          "type": "number",
          "nullable": true,
          "description": "Current boarding group end number"
        },
        "nextAllocationTime": {
          "type": "string",
          "format": "date-time",
          "nullable": true,
          "description": "Next boarding group allocation time"
        },
        "estimatedWait": {
          "type": "number",
          "nullable": true,
          "description": "Estimated wait time in minutes"
        }
      },
      "description": "Boarding Group queue type for attractions that offer it. You get allocated a boarding group number and wait until your group is called. No additional cost."
    },
    "PAID_STANDBY": {
      "type": "object",
      "required": [
        "waitTime"
      ],
      "properties": {
        "waitTime": {
          "type": "number",
          "nullable": true,
          "description": "Current paid standby wait time in minutes"
        }
      },
      "description": "Paid Standby queue type for attractions that offer it. You pay an additional cost to use a separate standby line, usually with a shorter wait time."
    }
  }
});

registerTypeSchema("LiveTimeSlot", {
  "type": "object",
  "required": [
    "type"
  ],
  "properties": {
    "type": {
      "type": "string",
      "description": "Type of time entry"
    },
    "startTime": {
      "type": "string",
      "format": "date-time",
      "nullable": true,
      "description": "Start time"
    },
    "endTime": {
      "type": "string",
      "format": "date-time",
      "nullable": true,
      "description": "End time"
    }
  },
  "description": "Time entry for shows or attraction operating hours"
});

registerTypeSchema("DiningAvailability", {
  "type": "object",
  "properties": {
    "partySize": {
      "type": "number",
      "nullable": true,
      "description": "Available party size"
    },
    "waitTime": {
      "type": "number",
      "nullable": true,
      "description": "Current wait time in minutes"
    }
  },
  "description": "Dining availability information for restaurants"
});

registerTypeSchema("LiveData", {
  "type": "object",
  "required": [
    "id"
  ],
  "properties": {
    "id": {
      "type": "string",
      "description": "Entity identifier"
    },
    "status": {
      "$ref": "#/properties/LiveStatusType",
      "description": "Current operating status of the entity"
    },
    "queue": {
      "$ref": "#/properties/LiveQueue",
      "description": "Current queue information for entities with queues (e.g. attractions)"
    },
    "showtimes": {
      "type": "array",
      "items": {
        "$ref": "#/properties/LiveTimeSlot"
      },
      "description": "Array of showtime entries for entities that have scheduled showtimes (e.g. shows)"
    },
    "operatingHours": {
      "type": "array",
      "items": {
        "$ref": "#/properties/LiveTimeSlot"
      },
      "description": "Array of operating hours entries for entities that have specific operating hours (e.g. parks, restaurants)"
    },
    "diningAvailability": {
      "type": "array",
      "items": {
        "$ref": "#/properties/DiningAvailability"
      },
      "description": "Array of dining availability entries for entities that have dining options (e.g. restaurants)"
    }
  }
});

