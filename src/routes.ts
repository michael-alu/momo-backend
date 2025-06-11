import express from "express";
import {
  getMonthlySummary,
  getSummaryByType,
  getTransaction,
  getTransactions,
} from "./controllers";

const router = express.Router();

router.get("/transactions", getTransactions as any);

router.get("/transactions/:id", getTransaction as any);

router.get("/summary-by-type", getSummaryByType as any);

router.get("/monthly-summary", getMonthlySummary as any);

export default router;
