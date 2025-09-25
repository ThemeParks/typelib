// THIS FILE IS GENERATED - DO NOT EDIT DIRECTLY

export type V1RootResponse = {
    
    /** Whether the request was successful */
    success: boolean;
    
    /** Welcome message for the API */
    message: string;
    
    /** API version number */
    version: string;
}


// Runtime Schema Registration
import { registerTypeSchema } from "../type_register.js";

registerTypeSchema("V1RootResponse", {
  "type": "object",
  "required": [
    "success",
    "message",
    "version"
  ],
  "properties": {
    "success": {
      "type": "boolean",
      "description": "Whether the request was successful"
    },
    "message": {
      "type": "string",
      "description": "Welcome message for the API"
    },
    "version": {
      "type": "string",
      "description": "API version number"
    }
  }
});

