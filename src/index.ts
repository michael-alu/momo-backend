// This is the main file that starts our application
// It sets up the database and starts the server

import app from "./app";
import { config } from "./config";
import { sequelize, Transaction } from "./models";
import processSMS from "./process_sms";

/**
 * Makes sure our database has data to work with
 * If the database is empty, it processes SMS data to populate it
 */
const populateDB = async () => {
  try {
    // Connect to the database
    sequelize
      .sync()
      .then(() =>
        console.log(
          "\x1b[33m%s\x1b[0m",
          "\nConnected to the Database successfully"
        )
      )
      .catch(e => console.log("\x1b[34m%s\x1b[0m", e.message as string));

    // Check if we have any transactions
    const transactionCount = await Transaction.count();

    if (transactionCount <= 0) {
      console.log(
        "\nNo transactions found in database. Processing SMS data...\n"
      );

      // If no transactions, process SMS data to create them
      await processSMS();

      return console.log(
        "\x1b[33m%s\x1b[0m",
        "\nDatabase initialized with SMS data.\n"
      );
    }

    // If we already have transactions, just show how many
    return console.log(
      "\x1b[33m%s\x1b[0m",
      `\nDatabase already contains ${transactionCount} transactions.\n`
    );
  } catch (error) {
    console.error("\nDatabase initialization error:", { error });

    process.exit(1);
  }
};

/**
 * Starts our application
 * First makes sure the database is ready, then starts the server
 */
const start = async () => {
  try {
    // Make sure database is ready
    await populateDB();

    // Start the server
    app.listen(config.port, () => {
      console.log(
        "\x1b[32m%s\x1b[0m",
        "App is 🏃‍♂️🏃‍♂️🏃‍♂️🏃‍♂️🏃‍♂️ on port " + config.port
      );
    });
  } catch (error) {
    console.error("Server startup error:", { error });

    process.exit(1);
  }
};

// Start the application
start();
