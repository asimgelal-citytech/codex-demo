# CRUD User Application

This project is a minimal Node.js/Express application demonstrating a sign up form that stores user information in a PostgreSQL database.

## Features
- Sign up form collects name, username, email, contact number with country, password/confirmation, profile picture (5MB limit) and address
- Login form validates credentials from the database
- Simple admin route lists all registered users (requires login)

## Setup
1. Copy `.env.sample` to `.env` and adjust the PostgreSQL connection string and session secret.
2. Run `npm install` to install dependencies.
3. Execute the SQL in `db.sql` on your PostgreSQL server. This creates the `users` and `session` tables used by the app.
4. Start the app with `node server.js`.
5. Visit `http://localhost:3000/signup` to register a user.

If you see an error about the `session` table not existing, make sure you ran `db.sql` to create it.

The server requires a valid `DATABASE_URL` in your environment. If it's missing, the application will exit with an error message reminding you to create a `.env` file.

## Notes
This repository only contains source files. Dependencies must be installed separately.
