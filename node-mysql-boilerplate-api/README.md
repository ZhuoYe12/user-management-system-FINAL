# User Management System Backend API

This is the backend API for the User Management System, providing user authentication, registration, verification, and management functionalities.

## Technologies Used

*   **Database:** PostgreSQL
*   **Backend:** Node.js with Express and Sequelize ORM
*   **Frontend:** Angular (This backend is designed to work with a separate Angular frontend application deployed on Render)

## Recent Changes

*   Updated Sequelize model relationships in `_helpers/db.js` to explicitly define foreign key column names (`userId` for employees, `accountId` for refresh tokens) to resolve schema synchronization issues.
*   Added the `accountId` column to the `refresh-token.model.js`.
*   Added `mysql2` dependency to `package.json` (Note: While mysql2 was added during troubleshooting a potential database switch, the project currently uses PostgreSQL).

## Setup

To get the project running, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/AsenjoJL/user-management-system-backend/tree/salazar-final
    

2.  **Install Dependencies:** Install the necessary Node.js packages.

    ```bash
    npm install
    ```

3.  **Set up PostgreSQL Database:** You need a running PostgreSQL database instance. 
    *   If deploying on Railway, add a PostgreSQL database service to your project.
    *   Obtain the connection details for your PostgreSQL database (host, port, database name, user, password).

4.  **Configure Database Connection:** The application reads database connection details primarily from the `DATABASE_URL` environment variable (recommended for hosting platforms like Railway) or falls back to the `connectionString` in `config.json`.

    *   **Using `DATABASE_URL` (Recommended for Railway):** Set the `DATABASE_URL` environment variable on your hosting platform (e.g., Railway dashboard) to the full connection string URL for your PostgreSQL database. The format is typically:
        `postgresql://[user]:[password]@[host]:[port]/[database]`

        Example for Railway internal connection:
        `postgresql://[user]:[password]@[postgres-service-name].railway.internal:[port]/[database]`

    *   **Using `config.json` (for local development or if not using `DATABASE_URL`):** Update the `connectionString` and the `database` object in `node-mysql-boilerplate-api/config.json` with your PostgreSQL database details.

        ```json
        {
          "connectionString": "postgresql://[user]:[password]@[host]:[port]/[database]",
          "database": {
            "host": "[host]",
            "port": [port],
            "user": "[user]",
            "password": "[password]",
            "database": "[database]"
          },
          ...
        }
        ```
        (Replace placeholders with your actual PostgreSQL credentials and details)

5.  **Database Schema Synchronization:** Ensure your PostgreSQL database schema matches the Sequelize models. In `development` environment, `sequelize.sync({ alter: true })` is used to automatically sync. In `production`, it only verifies tables. You may need to:
    *   Run the application once in a development-like environment pointed to your DB to let Sequelize sync.
    *   Manually add columns (`details` to `workflows`, `approverId` to `requests`, `accountId` to `refreshTokens`) to your PostgreSQL database using a PostgreSQL client (like pgAdmin or DBeaver) based on your Sequelize models.

## Running the Application

To run the full application, you need both the backend API and the frontend Angular application running.

1.  **Run the Backend API:**

    Navigate to the `node-mysql-boilerplate-api` directory in your terminal.

    *   For development (with auto-reloading):

        ```bash
        npm run dev
        ```

    *   For production:

        ```bash
        npm start
        ```

    Ensure your database connection is configured correctly as described in step 4 of the Setup section. The backend will typically run on port 4000 (check `server.js`).

2.  **Run the Frontend Application:**

    Navigate to the `angular-signup-verification-boilerplate` directory (or wherever your Angular frontend is located).

    *   Install frontend dependencies:

        ```bash
        npm install
        ```

    *   Serve the application:

        ```bash
        ng serve
        ```

    The Angular development server will typically run on port 4200. Ensure the `apiUrl` in your frontend's environment files (`environment.ts` and `environment.prod.ts`) is set to the URL of your running backend API (e.g., `http://localhost:4000` for local development, or your Railway backend URL for production).

## Deployment

*   **Backend:** Deploy the `node-mysql-boilerplate-api` directory to your hosting platform (e.g., Railway). Ensure environment variables, particularly `DATABASE_URL`, are set correctly.
*   **Frontend:** Build the Angular application for production (`ng build --configuration=production`) and deploy the contents of the build output folder (`dist/angular-signup-verification-boilerplate` by default) to a static site hosting service (e.g., Render). Remember to configure the Publish Directory and SPA rewrite rules correctly.

## Key Files

*   `config.json`: Contains application configuration, including fallback database connection details.
*   `_helpers/db.js`: Initializes the database connection and Sequelize models, defines relationships.
*   `*/.model.js` files (e.g., `accounts/account.model.js`): Define the Sequelize models and their attributes. 