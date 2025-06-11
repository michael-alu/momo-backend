import * as dotenv from "dotenv";

dotenv.config();

const isDevelopment = process.env.NODE_ENV === "development";

export const config = {
  isDevelopment,
  port: Number(process.env.PORT) || 4000,
};
