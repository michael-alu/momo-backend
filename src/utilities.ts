import { Response } from "express";
import { PaginationResult } from "./interfaces";

/**
 * This is a function that returns a response object to the client.
 * @param status The success status as true or false.
 * @param data The data to be sent to the client.
 * @param message The message to be sent to the client.
 */
export function respond(
  res: Response,
  status: boolean | number = true,
  data: any = undefined,
  message = "Successful!"
) {
  let statusCode = status as number;

  if (typeof status === "boolean") {
    if (status) {
      statusCode = 200;
    } else {
      statusCode = 400;
    }
  }

  return res
    .status(statusCode)
    .send({ message, data, ok: statusCode >= 200 || statusCode < 300 });
}

export function paginate<T>(
  list: T[],
  totalCount: number,
  take: string | number
): PaginationResult<T> {
  return {
    list,
    totalCount,
    totalPages: Math.ceil(totalCount / Number(take || "10")),
  };
}

export const toFixed = (input: number | string) => {
  if (isNaN(input as number)) {
    throw new Error("Number cannot be converted");
  }

  if (typeof input === "string") {
    input = Number(input);
  }

  return Number(input.toFixed(2));
};
