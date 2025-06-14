import express from "express";
import {
  getAnalysis,
  getStatistics,
  getTransaction,
  getTransactions,
} from "./controllers";

const router = express.Router();

router.get("/transactions", getTransactions as any);

router.get("/transactions/:id", getTransaction as any);

router.get("/statistics", getStatistics as any);

router.get("/analysis", getAnalysis as any);

export default router;
