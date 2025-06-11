import fs, { writeFileSync } from "fs";
import path from "path";
import xml2js from "xml2js";
import { sequelize, Transaction } from "./models";
import winston from "winston";

const xmlFile = path.join(__dirname, "../data/modified_sms_v2.xml");

const logFile = path.join(__dirname, "../logs/unprocessed.log");

const BATCH_SIZE = 50;

// Logger for unprocessed messages
const logger = winston.createLogger({
  transports: [new winston.transports.File({ filename: logFile })],
});

interface SMS {
  address: string;
  body: string;
  type: string;
  readable_date: string;
  contact_name: string;
  [key: string]: any;
}

interface SenderReceiver {
  sender: string | null;
  receiver: string | null;
}

// Extracts amount from inputs like '2,000 RWF'
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

// Extracts date from inputs like '2024-05-10 16:30:51'
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

// Categorize SMS by body content
const categorizeSMS = (body?: string): string => {
  if (!body) {
    return "Unknown";
  }

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

// Parse sender/receiver from body
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

export default async function main(): Promise<void> {
  try {
    await sequelize.sync();

    const xml = fs.readFileSync(xmlFile, "utf8");

    const parser = new xml2js.Parser({ explicitArray: false });

    const result = await parser.parseStringPromise(xml);

    const messages: { $: SMS }[] = result.smses.sms;

    let count = 0;

    let ignored = 0;

    // Process messages in batches
    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const batch = messages.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async message => {
        const sms = message.$;

        try {
          const body = sms.body || "No Body provided";

          const transaction_type = categorizeSMS(body);

          const amount = extractAmount(body) || 0;

          const sms_date =
            extractDate(body) ||
            (sms.readable_date ? new Date(sms.readable_date) : new Date());

          // Extract fee
          const feeMatch = body.match(/Fee (?:was|paid):?\s*([\d,]+) RWF/);

          const fee = feeMatch
            ? parseInt(feeMatch[1].replace(/,/g, ""), 10)
            : 0;

          // Extract balance
          const balanceMatch = body.match(/balance:?\s*([\d,]+) RWF/i);

          const balance = balanceMatch
            ? parseInt(balanceMatch[1].replace(/,/g, ""), 10)
            : null;

          // Extract transaction IDs
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

          // Extract sender/receiver
          const { sender, receiver } = extractSenderReceiver(
            body,
            transaction_type
          );

          // Create transaction
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

      // Wait for all promises in the batch to complete
      const results = await Promise.all(batchPromises);

      // Update counters
      results.forEach(result => {
        if (result.success) {
          count++;
        } else {
          ignored++;
        }
      });

      // Log progress
      console.log(
        `\n\nProcessed ${i + batch.length} of ${
          messages.length
        } messages...\n\n`
      );
    }

    console.log(
      `\n\nSMS Processing complete. Processed: ${count}, Ignored: ${ignored}\n\n`
    );

    // Write final stats to a log file
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
