import { Optional } from "sequelize/types";

// This file defines the shapes of our data (like blueprints for our data)

// This interface helps us handle pagination (showing data page by page)
export interface PaginationResult<T> {
  totalCount: number; // Total number of items
  totalPages: number; // Total number of pages
  list: T[]; // The actual items for the current page
}

// This interface defines what query parameters we can use when searching transactions
export interface TransactionQuery {
  type?: string;
  minAmount?: string;
  maxAmount?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  take?: string;
  page?: string;
}

// This interface defines what a transaction looks like in our database
export interface TransactionAttributes {
  id: number;
  sms_address: string;
  sms_date: Date;
  sms_type: string;
  sms_body: string;
  transaction_type: string;
  amount: number;
  currency: string;
  sender: string | null;
  receiver: string | null;
  balance: number | null;
  fee: number;
  transaction_id: string | null;
  external_transaction_id: string | null;
  message: string;
  readable_date: string | null;
  contact_name: string | null;
  raw_json: any;
}

// This interface is used when creating a new transaction, it's the same as TransactionAttributes but the ID is optional because the database will generate it for us
export interface CreateTransactionInput
  extends Optional<TransactionAttributes, "id"> {}
