# ShipStream

## Project Overview

ShipStream is a web application designed to help users manage and track furniture deliveries. It allows users to create accounts, manage shipments, register tracking numbers, monitor delivery updates, and manage their subscription plans.

The application integrates 17TRACK for shipment tracking and PayMongo for subscription payments. It also includes user authentication, shipment management, and a Business subscription plan. The application is deployed on Render, with Supabase PostgreSQL used for database storage.

## Technologies Used

**Frontend**
- React.js
- Vite
- React Router

**Backend**
- Node.js
- Express.js

**Database**
- Supabase PostgreSQL

**Delivery Tracking API**
- 17TRACK API

**Payment Gateway**
- PayMongo Hosted Checkout

**Authentication and Security**
- JWT-based authentication
- HTTP-only cookies
- Password hashing with bcrypt
- Environment variables for sensitive credentials

**Deployment**
- Render
- GitHub

## Main Features

- **User Authentication:** Register, log in, and log out securely.
- **Shipment Management:** Create, view, update, and manage delivery records.
- **Shipment Tracking:** Register tracking numbers and retrieve tracking information through 17TRACK.
- **Subscription Plans:** View available plans and upgrade to the Business plan.
- **Payment Processing:** Use PayMongo Hosted Checkout to process subscription payments.
- **Payment History:** View recorded payment transactions and their statuses.
- **Database Storage:** Store user accounts, shipments, payment records, and subscription information in Supabase.

## Setup and Installation

### Prerequisites

Before running the project locally, prepare the following:

- Node.js and npm
- A Supabase project
- A 17TRACK API token
- PayMongo test API credentials
- Git

### 1. Clone the Repository

git clone THE_REPO_URL
cd ShipStream

Replace `THE_REPO_URL` with the actual GitHub repository URL.

### 2. Install Dependencies

Install the backend dependencies:

cd shipstream-backend
npm install

Install the frontend dependencies in a separate terminal:


cd ShipStream/shipstream-frontend
npm install

If your terminal is already inside the project root, you can simply run:

cd shipstream-frontend
npm install

### 3. Configure Environment Variables

Create the required `.env` files based on the project's `.env.example` file or files. Add your own credentials and configuration values.

Configure the appropriate variables for the backend, including:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `JWT_SECRET`
- `FRONTEND_URL`
- `TRACK17_API_KEY`
- `PAYMONGO_SECRET_KEY`

The frontend may also require `VITE_API_URL`, depending on the current configuration. For local development, it should point to the backend, commonly `http://localhost:5000`. If the frontend code already uses a development fallback, this variable may not be necessary locally.

Use a strong JWT secret and keep all API keys private. Never commit actual `.env` files or secret credentials to GitHub. Only commit example files with placeholder values.

### 4. Start the Application

Start the backend in one terminal:

cd shipstream-backend
npm run dev

Start the frontend in another terminal:

cd shipstream-frontend
npm run dev

Open the local frontend URL displayed by Vite, commonly:

`http://localhost:5173`

The backend commonly runs on port `5000` during local development. Check each directory's `package.json` and environment configuration if the commands or ports differ.

## External API Integration: 17TRACK

ShipStream uses the 17TRACK API to register tracking numbers and retrieve shipment information. This allows users to monitor furniture deliveries without manually checking individual courier websites.

The API was selected because it supports shipment tracking across multiple supported carriers through a single integration.

The backend communicates with 17TRACK and keeps the API token on the server instead of exposing it in frontend code. Shipment tracking depends on valid API credentials, supported carriers, and the tracking information returned by 17TRACK.

## Payment Integration: PayMongo

ShipStream uses PayMongo Hosted Checkout to support subscription payments. Hosted Checkout allows users to complete payments on PayMongo's checkout page rather than requiring the application to handle card details directly.

### Test Payment Flow

1. The user creates an account and visits the Plans page.
2. The user selects the Business plan and initiates checkout.
3. The frontend sends a request to the backend to create a checkout session.
4. The backend creates a payment record in Supabase and requests a PayMongo Checkout Session using the secret test key.
5. The user is redirected to PayMongo's hosted checkout page.
6. After a successful payment, PayMongo sends the `checkout_session.payment.paid` webhook event to the backend.
7. The backend verifies the webhook signature and validates the payment details.
8. The backend processes the confirmed payment and updates the payment and subscription records.

The webhook is important because the application should not rely solely on the user's return to the website to determine whether a payment succeeded. Payment confirmation must be handled on the backend, with appropriate signature verification and safeguards against duplicate webhook events.

The integration was tested using PayMongo's test environment. A successful test produced the `checkout_session.payment.paid` webhook event.

**Important:** A cancelled or expired checkout is not the same as a confirmed card decline. PayMongo Hosted Checkout handles card errors on its checkout page, and the application should not mark a payment as failed unless the backend has sufficient confirmation.

Test credentials and test payments are used during development. They do not represent actual customer payments.

## Database

ShipStream uses Supabase PostgreSQL to store application data. The database supports the application's authentication-related records, shipment information, payment history, and subscription management.

The backend communicates with Supabase to perform database operations and enforce user-specific access to protected resources.

Use the database schema and any required SQL functions or migrations provided with the project when setting up a new environment.

## Deployment

ShipStream is deployed using Render, with the source code maintained in GitHub.

The deployed application consists of the frontend and backend components. The frontend communicates with the backend API, while the backend connects to Supabase, 17TRACK, and PayMongo.

When deploying or updating the application:

1. Push the latest changes to the GitHub repository.
2. Confirm that the frontend build completes successfully.
3. Configure the required environment variables in Render.
4. Verify the frontend API URL and backend CORS configuration.
5. Confirm that the Supabase credentials and external API keys are correct.
6. Configure the PayMongo webhook to point to the deployed backend endpoint.
7. Test registration, login, shipment tracking, subscription checkout, and payment confirmation.

Do not include production secrets or API tokens in the repository.

## Future Improvements

Possible improvements for future versions include:

- More courier integrations and improved tracking updates.
- A more detailed shipment notification system.
- Subscription cancellation and management features.
- Better handling of failed payments, expired checkouts, and repeated webhook events.
- Improved tracking-number validation and error messages.
- Additional deployment monitoring and automated tests.

## Project Notes

ShipStream was developed to demonstrate the integration of frontend development, backend APIs, database management, shipment tracking, authentication, subscription management, and online payment processing in a single web application.