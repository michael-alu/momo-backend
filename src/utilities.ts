// This file contains helper functions that we use throughout our application

import { Response } from "express";
import { PaginationResult } from "./interfaces";

/**
 * Sends a response back to the client in a consistent format
 * @param res - The Express response object
 * @param status - Whether the request was successful (true/false) or a status code (like 200, 404)
 * @param data - The data to send back to the client
 * @param message - A message explaining what happened
 */
export function respond(
  res: Response,
  status: boolean | number = true,
  data: any = undefined,
  message = "Successful!"
) {
  // Convert boolean status to HTTP status code
  let statusCode = status as number;

  if (typeof status === "boolean") {
    if (status) {
      statusCode = 200; // OK
    } else {
      statusCode = 400; // Bad Request
    }
  }

  // Send response with consistent format
  return res.status(statusCode).send({
    message,
    data,
    ok: statusCode >= 200 || statusCode < 300, // true if status code is between 200 and 300
  });
}

/**
 * Helps split a list of items into pages
 * @param list - The items to paginate
 * @param totalCount - Total number of items
 * @param take - How many items per page
 */
export function paginate<T>(
  list: T[],
  totalCount: number,
  take: string | number
): PaginationResult<T> {
  return {
    list, // Items for current page
    totalCount, // Total number of items
    totalPages: Math.ceil(totalCount / Number(take || "10")), // Total number of pages
  };
}

/**
 * Rounds a number to 2 decimal places
 * @param input - The number to round
 */
export const toFixed = (input: number | string) => {
  // Check if input is a valid number
  if (isNaN(input as number)) {
    throw new Error("Number cannot be converted");
  }

  // Convert string to number if needed
  if (typeof input === "string") {
    input = Number(input);
  }

  // Round to 2 decimal places
  return Number(input.toFixed(2));
};
