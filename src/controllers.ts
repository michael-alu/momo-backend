import { Request, Response } from "express";
import { Op, QueryTypes, WhereOptions } from "sequelize";
import { sequelize, Transaction } from "./models";
import { paginate, respond } from "./utilities";
import { TransactionAttributes, TransactionQuery } from "./interfaces";

export const welcome = (req: Request, res: Response) => {
  return res.send("Welcome to our MoMo API! 🚀");
};

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

    const where: WhereOptions<TransactionAttributes> = {};

    if (type) {
      where.transaction_type = type;
    }

    if (minAmount || maxAmount) {
      where.amount = {};

      if (minAmount) {
        const min = Number(minAmount);

        if (!isNaN(min)) {
          where.amount = { ...where.amount, [Op.gte]: min };
        }
      }

      if (maxAmount) {
        const max = Number(maxAmount);

        if (!isNaN(max)) {
          where.amount = { ...where.amount, [Op.lte]: max };
        }
      }
    }

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

    if (search) {
      where.sms_body = { [Op.like]: `%${search}%` };
    }

    const limit = parseInt(take, 10);

    const offset = (Number(page) - 1) * limit;

    const totalCount = await Transaction.count({ where });

    const transactions = await Transaction.findAll({
      where,
      limit,
      offset,
      order: [["sms_date", "DESC"]],
    });

    return respond(res, true, paginate(transactions, totalCount, take));
  } catch (error: any) {
    return respond(res, 500, error, error?.message || "Internal Server Error");
  }
};

export const getTransaction = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return respond(res, false, undefined, "Please provide a Transaction ID");
    }

    const transaction = await Transaction.findByPk(Number(req.params.id));

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

export const getSummaryByType = async (req: Request, res: Response) => {
  try {
    const transactions = await Transaction.findAll({
      attributes: [
        "transaction_type",
        [sequelize.fn("SUM", sequelize.col("amount")), "total"],
      ],
      group: ["transaction_type"],
      order: [[sequelize.fn("SUM", sequelize.col("amount")), "DESC"]],
    });

    return respond(res, true, transactions);
  } catch (error: any) {
    return respond(res, 500, error, error?.message || "Internal Server Error");
  }
};

export const getMonthlySummary = async (req: Request, res: Response) => {
  try {
    const summary = await sequelize.query(
      `
          SELECT strftime('%Y-%m', sms_date) as month, transaction_type, SUM(amount) as total
          FROM Transactions
          GROUP BY month, transaction_type
          ORDER BY month DESC, transaction_type
        `,
      { type: QueryTypes.SELECT }
    );

    return respond(res, true, summary);
  } catch (error: any) {
    return respond(res, 500, error, error?.message || "Internal Server Error");
  }
};
