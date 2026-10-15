ShipStream

Project Overview

ShipStream is a web application designed to help users manage and track furniture deliveries. It provides an interface for users to access their accounts, register delivery tracking numbers, monitor shipment updates, and manage their subscription plans.

The application uses React for the frontend, Node.js and Express for the backend, Supabase PostgreSQL for database storage, 17TRACK for shipment tracking, and PayMongo for payment processing.

Technologies Used:
Frontend: 
- React.js
- Vite

Backend: 
- Node.js
- Express.js

Database: 
- Supabase PostgreSQL

Delivery Tracking API: 
- 17TRACK API

Payment Gateway: 
- PayMongo

Authentication: 
- JWT-based authentication


Setup and Installation:
Prerequisites
- Node.js and npm
- A Supabase project
- A 17TRACK API token
- PayMongo test credentials

1. Clone the Repository

git clone THE_REPO_URL
cd ShipStream

Note: Replace THE_REPO_URL with the actual GitHub repository URL.

2. Install Dependencies

Open a terminal in the frontend directory:
- cd shipstream-frontend
- npm install

Open another terminal in the backend directory:
- cd shipstream-backend
- npm install

3. Configure Environment Variables

Create the required .env file using .env.example as a reference. Add your own credentials and configuration values.
Configure the Supabase project URL and database credentials, JWT secret, 17TRACK API token, and PayMongo test credentials according to the variables used by the backend.

4. Start the Application

Start the backend in its own terminal:
- cd shipstream-backend
- npm run dev

Start the frontend in another terminal:
- cd shipstream-frontend
- npm run dev

Use the local frontend URL displayed by Vite, commonly http://localhost:5173. The backend is configured to use port 5000 in the local development setup.
If the project uses different npm scripts or ports, follow the configuration in its respective package.json and environment files.

External API (17TRACK):
ShipStream uses the 17TRACK API to register tracking numbers and retrieve shipment information. This integration allows users to monitor furniture deliveries without manually checking each courier's tracking website. The API was selected because it provides shipment-tracking functionality across supported carriers through a single integration. The backend handles requests to the API so that the tracking token is not exposed in the browser.

PayMongo Test Payment Flow:
PayMongo is integrated to support subscription payments through its hosted checkout process.

The test flow works as follows:
- The user selects a subscription plan.
- The frontend sends a request to the backend to initiate checkout.
- The backend creates a PayMongo Checkout Session using the secret test key.
- The user is redirected to PayMongo's hosted checkout page to complete the test payment.
- PayMongo sends a webhook event to the backend when the payment succeeds.
- The backend processes the checkout_session.payment.paid event and updates the corresponding payment or subscription status.

The webhook is important because the application should not rely only on the user's return to the website to determine whether a payment succeeded. The backend must verify the webhook according to PayMongo's signature-verification requirements and handle repeated events safely.

The integration was tested using PayMongo's test environment and a subscription plan. A successful test produced a checkout_session.payment.paid webhook event.

Note: Test credentials and test payments are used during development. They do not represent actual customer payments.