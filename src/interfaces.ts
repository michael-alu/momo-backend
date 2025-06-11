import { Optional } from "sequelize/types";

export interface PaginationResult<T> {
  totalCount: number;
  totalPages: number;
  list: T[];
}

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

export interface CreateTransactionInput
  extends Optional<TransactionAttributes, "id"> {}
