import app from "./app";
import { config } from "./config";
import { sequelize, Transaction } from "./models";
import processSMS from "./process_sms";

const populateDB = async () => {
  try {
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

      // Process SMS data
      await processSMS();

      return console.log(
        "\x1b[33m%s\x1b[0m",
        "\nDatabase initialized with SMS data.\n"
      );
    }

    return console.log(
      "\x1b[33m%s\x1b[0m",
      `\nDatabase already contains ${transactionCount} transactions.\n`
    );
  } catch (error) {
    console.error("\nDatabase initialization error:", { error });

    process.exit(1);
  }
};

const start = async () => {
  try {
    // Check if Database is populated and populate if not
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

start();
