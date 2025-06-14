# MoMo Backend API

This is a backend API that processes and analyzes Mobile Money (MoMo) transaction data from SMS messages. It helps track and understand your mobile money transactions by providing statistics and analysis.

## What This Project Does

- Takes SMS messages about MoMo transactions and stores them in a database
- Shows you all your transactions with filters (by date, amount, type)
- Gives you statistics about your transactions (total count, total amount, average)
- Shows you patterns in your spending and receiving over time
- Helps you understand where your money is going and coming from

## How to Run This Project

### First Time Setup

1. Make sure you have:

   - Node.js (v22 or higher)
   - Yarn or npm (any version is fine)
   - SQLite3 (comes with most systems)

2. Get the code:

```bash
git clone https://github.com/michael-alu/momo-backend.git
cd momo-backend
```

3. Install the required packages:

```bash
yarn install
# or
npm install
```

4. Build the project:

```bash
yarn build
# or
npm run build
```

5. Set up the database (this will process all the SMS data):

```bash
yarn process
# or
npm run process
```

### Running the Project

For development (with auto-reload):

```bash
yarn dev
# or
npm run dev
```

For production:

```bash
yarn start
# or
npm start
```

The API will be available locally at `http://localhost:4000` if you specify no port.

> **Important Note**: The API will automatically create and populate the database with sample data if no database exists. You don't need to run any additional commands to set up the database - it's all handled automatically when you start the server!

## What You Can Do With This API

### 1. See All Transactions

- **GET** `/transactions`
- You can filter by:
  - Type of transaction
  - Amount range
  - Date range
  - Search in message
  - Page number and how many to show

### 2. See One Transaction

- **GET** `/transactions/:id`
- Shows details of a specific transaction

### 3. Get Statistics

- **GET** `/statistics`
- Shows:
  - How many transactions you have
  - Total amount of money
  - Average amount per transaction
- You can filter by transaction type

### 4. Get Analysis

- **GET** `/analysis`
- Shows your money flow over time
- You can:
  - See all transactions
  - See just incoming money
  - See just outgoing money
  - Choose how many days to look at (default is 30)

## Types of Transactions

The system recognizes these types of transactions:

- Money coming in:
  - Incoming Money
  - Bank Transfers
- Money going out:
  - Payments to Code Holders
  - Transfers to Mobile Numbers
  - Bank Deposits
  - Airtime Bill Payments
  - Cash Power Bill Payments
  - Withdrawals from Agents
  - Internet and Voice Bundle Purchases
  - Transactions Initiated by Third Parties
- Other (for anything that doesn't fit above)

## Where to Find Logs

If something goes wrong, check the `logs` folder:

- `unprocessed.log`: Shows messages that couldn't be processed
- `processing-stats.json`: Shows how many messages were processed

## Project Structure

The main code is in the `src` folder:

- `controllers.ts`: Handles all the API requests
- `models.ts`: Defines how data is stored
- `process_sms.ts`: Processes the SMS messages
- `routes.ts`: Defines the API endpoints
- Other files handle setup and utilities

## Notes

- The database is SQLite, so it's just a file (`momo.db`)
- All dates are in UTC
- Amounts are in RWF (Rwandan Francs)
- The system processes SMS messages in batches of 50
- The database is automatically created and populated when you first start the server
