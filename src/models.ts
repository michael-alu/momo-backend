// This file sets up our database connection and defines our database tables

import path from "path";
import { Sequelize, DataTypes, Model } from "sequelize";
import { config } from "./config";
import { TransactionAttributes, CreateTransactionInput } from "./interfaces";

// Create a connection to our SQLite database
// SQLite is a simple file-based database, perfect for learning
export const sequelize = new Sequelize({
  dialect: "sqlite",
  logging: config.isDevelopment,
  storage: path.join(__dirname, "../momo.sqlite"),
});

// This class represents our Transaction table in the database
// It tells Sequelize (our database helper) what our table looks like
export class Transaction
  extends Model<TransactionAttributes, CreateTransactionInput>
  implements TransactionAttributes
{
  public id!: number;
  public sms_address!: string;
  public sms_date!: Date;
  public sms_type!: string;
  public sms_body!: string;
  public transaction_type!: string;
  public amount!: number;
  public currency!: string;
  public sender!: string | null;
  public receiver!: string | null;
  public balance!: number | null;
  public fee!: number;
  public transaction_id!: string | null;
  public external_transaction_id!: string | null;
  public message!: string;
  public readable_date!: string | null;
  public contact_name!: string | null;
  public raw_json!: any;
}

// This sets up the actual table in the database
Transaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sms_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sms_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    sms_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sms_body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    transaction_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "RWF",
    },
    sender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    receiver: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    balance: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    fee: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    transaction_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    external_transaction_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    readable_date: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contact_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    raw_json: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Transaction",
  }
);
