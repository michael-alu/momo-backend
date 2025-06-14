// This file handles processing SMS messages and storing them in our database
// It's the most complex code here, so take your time to understand
// It reads SMS data from an XML file and converts it into transactions

import fs, { writeFileSync } from "fs";
import path from "path";
import xml2js from "xml2js";
import { sequelize, Transaction } from "./models";
import winston from "winston";

// Where to find our SMS data
const xmlFile = path.join(__dirname, "../data/modified_sms_v2.xml");

// Where to log any messages we couldn't process
const logFile = path.join(__dirname, "../logs/unprocessed.log");

// How many messages to process at once
const BATCH_SIZE = 50;

// Set up logging for messages we can't process
const logger = winston.createLogger({
  transports: [new winston.transports.File({ filename: logFile })],
});

// What an SMS message looks like
interface SMS {
  address: string;
  body: string;
  type: string;
  readable_date: string;
  contact_name: string;
  [key: string]: any;
}

// Helper interface for sender/receiver info
interface SenderReceiver {
  sender: string | null;
  receiver: string | null;
}

// Helper function to get the amount from text like '2,000 RWF'
const extractAmount = (input?: string): number | null => {
  if (!input) {
    return null;
  }

  const match = input.replace(/,/g, "").match(/(\d+)\s*RWF/);

  if (!match) {
    return null;
  }

  return parseInt(match[1], 10);
};

// Helper function to get date from text like '2024-05-10 16:30:51'
const extractDate = (input?: string): Date | null => {
  if (!input) {
    return null;
  }

  const match = input.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);

  if (!match) {
    return null;
  }

  return new Date(match[0]);
};

// Figure out what kind of transaction this is based on the message
const categorizeSMS = (body?: string): string => {
  if (!body) {
    return "Unknown";
  }

  // Check message content to determine transaction type
  if (/received/.test(body) && /from/.test(body)) {
    return "Incoming Money";
  }

  if (/payment of/.test(body) && /to/.test(body)) {
    return "Payments to Code Holders";
  }

  if (/transferred to/.test(body) && /from/.test(body)) {
    return "Transfers to Mobile Numbers";
  }

  if (/bank deposit/.test(body)) {
    return "Bank Deposits";
  }

  if (/Airtime/.test(body)) {
    return "Airtime Bill Payments";
  }

  if (/Cash Power/.test(body)) {
    return "Cash Power Bill Payments";
  }

  if (/by/.test(body) && /on your MOMO account/.test(body)) {
    return "Transactions Initiated by Third Parties";
  }

  if (/withdrawn/.test(body) && /agent/.test(body)) {
    return "Withdrawals from Agents";
  }

  if (/External Transaction Id/.test(body)) {
    return "Bank Transfers";
  }

  if (/Bundles and Packs|internet|voice bundle/i.test(body)) {
    return "Internet and Voice Bundle Purchases";
  }

  return "Other";
};

// Get sender and receiver info from the message
const extractSenderReceiver = (body: string, type: string): SenderReceiver => {
  let sender: string | null = null;

  let receiver: string | null = null;

  if (type === "Incoming Money") {
    const match = body.match(/from ([^\(]+) \(/);

    sender = match ? match[1].trim() : null;
  } else if (
    ["Payments to Code Holders", "Transfers to Mobile Numbers"].includes(type)
  ) {
    const match = body.match(/to ([^\d]+) ?(\d+|\()/);

    receiver = match ? match[1].trim() : null;
  }

  return { sender, receiver };
};

// Main function that processes all SMS messages
export default async function main(): Promise<void> {
  try {
    // Make sure database is ready
    await sequelize.sync();

    // Read the XML file
    const xml = fs.readFileSync(xmlFile, "utf8");

    // Parse XML into JavaScript objects
    const parser = new xml2js.Parser({ explicitArray: false });

    const result = await parser.parseStringPromise(xml);

    const messages: { $: SMS }[] = result.smses.sms;

    let count = 0; // How many messages we processed
    let ignored = 0; // How many messages we couldn't process

    // Process messages in small batches to make it faster
    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const batch = messages.slice(i, i + BATCH_SIZE);

      // Process each message in the batch
      const batchPromises = batch.map(async message => {
        const sms = message.$;

        try {
          const body = sms.body || "No Body provided";

          const transaction_type = categorizeSMS(body);

          const amount = extractAmount(body) || 0;

          const sms_date =
            extractDate(body) ||
            (sms.readable_date ? new Date(sms.readable_date) : new Date());

          // Get transaction fee
          const feeMatch = body.match(/Fee (?:was|paid):?\s*([\d,]+) RWF/);

          const fee = feeMatch
            ? parseInt(feeMatch[1].replace(/,/g, ""), 10)
            : 0;

          // Get account balance
          const balanceMatch = body.match(/balance:?\s*([\d,]+) RWF/i);

          const balance = balanceMatch
            ? parseInt(balanceMatch[1].replace(/,/g, ""), 10)
            : null;

          // Get transaction IDs
          const transactionIdMatch =
            body.match(/Transaction Id:?\s*(\d+)/i) ||
            body.match(/TxId:?\s*(\d+)/i);

          const transaction_id = transactionIdMatch
            ? transactionIdMatch[1]
            : null;

          const externalIdMatch = body.match(
            /External Transaction Id:?\s*([\w-]+)/i
          );

          const external_transaction_id = externalIdMatch
            ? externalIdMatch[1]
            : null;

          // Get sender/receiver info
          const { sender, receiver } = extractSenderReceiver(
            body,
            transaction_type
          );

          // Save transaction to database
          const transaction = await Transaction.create({
            sms_address: sms.address || "",
            sms_date,
            sms_type: sms.type || "unknown",
            sms_body: body,
            transaction_type,
            amount,
            currency: "RWF",
            sender,
            receiver,
            balance,
            fee,
            transaction_id,
            external_transaction_id,
            message: body,
            readable_date: sms.readable_date || null,
            contact_name: sms.contact_name || null,
            raw_json: sms,
          });

          if (transaction) {
            return { success: true };
          } else {
            logger.warn({ sms, error: "Failed to create transaction" });
            return { success: false };
          }
        } catch (err) {
          logger.warn({ sms, error: (err as Error).message });
          return { success: false };
        }
      });

      // Wait for all messages in this batch to finish
      const results = await Promise.all(batchPromises);

      // Count successes and failures
      results.forEach(result => {
        if (result.success) {
          count++;
        } else {
          ignored++;
        }
      });

      // Show progress
      console.log(
        `\n\nProcessed ${i + batch.length} of ${
          messages.length
        } messages...\n\n`
      );
    }

    // Show final results
    console.log(
      `\n\nSMS Processing complete. Processed: ${count}, Ignored: ${ignored}\n\n`
    );

    // Save processing statistics to a file
    writeFileSync(
      path.join(__dirname, "../logs/processing-stats.json"),
      JSON.stringify(
        {
          ignored,
          processed: count,
          total: messages.length,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error("SMS Processing Error:", error);

    process.exit(1);
  }
}
