// This file contains all the functions that handle our API requests
// Each function is called a "controller" and handles a specific type of request

import { Request, Response } from "express";
import { Op, WhereOptions } from "sequelize";
import { sequelize, Transaction } from "./models";
import { paginate, respond, toFixed } from "./utilities";
import { TransactionAttributes, TransactionQuery } from "./interfaces";

/**
 * Shows a welcome message when someone visits our API
 */
export const welcome = (req: Request, res: Response) => {
  return res.send("Welcome to our MoMo API! 🚀");
};

/**
 * Gets a list of transactions with filtering and pagination
 * You can filter by:
 * - type (like "deposit" or "withdrawal")
 * - amount range (min and max)
 * - date range (start and end)
 * - search text in the message
 */
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const {
      type,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      search,
      take = "10",
      page = "1",
    } = req.query as TransactionQuery;

    // Start building our database query
    const where: WhereOptions<TransactionAttributes> = {};

    // Add filters if they were provided
    if (type) {
      where.transaction_type = type;
    }

    // Handle amount range
    if (minAmount || maxAmount) {
      where.amount = {};

      if (minAmount) {
        const min = Number(minAmount);

        if (!isNaN(min)) {
          where.amount = { ...where.amount, [Op.gte]: min }; // gte = greater than or equal
        }
      }

      if (maxAmount) {
        const max = Number(maxAmount);

        if (!isNaN(max)) {
          where.amount = { ...where.amount, [Op.lte]: max }; // lte = less than or equal
        }
      }
    }

    // Handle date range
    if (startDate || endDate) {
      where.sms_date = {};

      if (startDate) {
        const start = new Date(startDate);

        if (!isNaN(start.getTime())) {
          where.sms_date = { ...where.sms_date, [Op.gte]: start };
        }
      }

      if (endDate) {
        const end = new Date(endDate);

        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59);

          where.sms_date = { ...where.sms_date, [Op.lte]: end };
        }
      }
    }

    // Handle text search
    if (search) {
      where.sms_body = { [Op.like]: `%${search}%` }; // % means match any text before/after
    }

    // Calculate pagination
    const limit = parseInt(take, 10);

    const offset = (Number(page) - 1) * limit;

    // Get total count for pagination
    const totalCount = await Transaction.count({ where });

    // Get the actual transactions
    const transactions = await Transaction.findAll({
      where,
      limit,
      offset,
      order: [["sms_date", "DESC"]], // Show newest first
    });

    return respond(res, true, paginate(transactions, totalCount, take));
  } catch (error: any) {
    return respond(res, 500, error, error?.message || "Internal Server Error");
  }
};

/**
 * Gets a single transaction by its ID
 */
export const getTransaction = async (req: Request, res: Response) => {
  try {
    // Check if ID was provided
    if (!req.params.id) {
      return respond(res, false, undefined, "Please provide a Transaction ID");
    }

    // Find the transaction
    const transaction = await Transaction.findByPk(Number(req.params.id));

    // Check if it exists
    if (!transaction) {
      return respond(
        res,
        404,
        undefined,
        `Transaction with ID (${req.params.id}) does not exist!`
      );
    }

    return respond(res, true, transaction);
  } catch (error: any) {
    return respond(res, 500, error, error?.message || "Internal Server Error");
  }
};

/**
 * Gets statistics about transactions
 * You can filter by transaction type
 * Returns:
 * - total number of transactions
 * - total amount of money
 * - average amount per transaction
 */
export const getStatistics = async (req: Request, res: Response) => {
  try {
    const { type } = req.query as { type?: string };

    // Add type filter if provided
    const where: WhereOptions<TransactionAttributes> = {};

    if (type) {
      where.transaction_type = type;
    }

    // Count total transactions
    const totalCount = await Transaction.count({ where });

    // Sum up all amounts
    const totalAmount = (await Transaction.sum("amount", { where })) || 0;

    // Calculate average
    let averageAmount = 0;

    if (totalCount > 0) {
      averageAmount = toFixed(totalAmount / totalCount);
    }

    return respond(res, true, {
      totalCount,
      totalAmount,
      averageAmount,
    });
  } catch (error: any) {
    return respond(res, 500, error, error?.message || "Internal Server Error");
  }
};

/**
 * Gets transaction data for charts
 * You can:
 * - Filter by transaction type
 * - Choose how many days to look back
 * Returns daily totals for:
 * - Money moved around (if type is specified)
 * - Money going in and out (if no type specified)
 */
export const getAnalysis = async (req: Request, res: Response) => {
  try {
    const { type, days = "30" } = req.query as { type?: string; days?: string };
    const numberOfDays = parseInt(days, 10) || 30;

    // Calculate start date based on last known transaction (Jan 15, 2025)
    const endDate = new Date("2025-01-15");
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - numberOfDays);

    // Helper to create array of dates
    const generateDateArray = () => {
      const dates = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    };

    // Helper to fill in missing dates with zero amounts
    const fillMissingDates = (data: any[]) => {
      const dateMap = new Map(data.map(item => [item.date, item.amount]));
      return generateDateArray().map(date => ({
        date: date.toISOString().split("T")[0],
        amount: dateMap.get(date.toISOString().split("T")[0]) || 0,
      }));
    };

    // If type is specified, get data for just that type
    if (type) {
      const data = await Transaction.findAll({
        attributes: [
          [sequelize.fn("DATE", sequelize.col("sms_date")), "date"],
          [sequelize.fn("SUM", sequelize.col("amount")), "amount"],
        ],
        where: {
          transaction_type: type,
          sms_date: {
            [Op.between]: [startDate, endDate],
          },
        },
        group: [sequelize.fn("DATE", sequelize.col("sms_date"))],
        order: [[sequelize.fn("DATE", sequelize.col("sms_date")), "ASC"]],
        raw: true,
      });

      return respond(res, true, {
        type: type,
        data: fillMissingDates(data),
      });
    }

    // If no type specified, get both incoming and outgoing money
    // Money coming in
    const incomingData = await Transaction.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("sms_date")), "date"],
        [sequelize.fn("SUM", sequelize.col("amount")), "amount"],
      ],
      where: {
        transaction_type: {
          [Op.in]: ["Incoming Money", "Bank Transfers"],
        },
        sms_date: {
          [Op.between]: [startDate, endDate],
        },
      },
      group: [sequelize.fn("DATE", sequelize.col("sms_date"))],
      order: [[sequelize.fn("DATE", sequelize.col("sms_date")), "ASC"]],
      raw: true,
    });

    // Money going out
    const outgoingData = await Transaction.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("sms_date")), "date"],
        [sequelize.fn("SUM", sequelize.col("amount")), "amount"],
      ],
      where: {
        transaction_type: {
          [Op.in]: [
            "Payments to Code Holders",
            "Transfers to Mobile Numbers",
            "Bank Deposits",
            "Airtime Bill Payments",
            "Cash Power Bill Payments",
            "Withdrawals from Agents",
            "Internet and Voice Bundle Purchases",
          ],
        },
        sms_date: {
          [Op.between]: [startDate, endDate],
        },
      },
      group: [sequelize.fn("DATE", sequelize.col("sms_date"))],
      order: [[sequelize.fn("DATE", sequelize.col("sms_date")), "ASC"]],
      raw: true,
    });

    return respond(res, true, {
      type: null,
      data: {
        incoming: fillMissingDates(incomingData),
        outgoing: fillMissingDates(outgoingData),
      },
    });
  } catch (error: any) {
    return respond(res, 500, error, error?.message || "Internal Server Error");
  }
};
