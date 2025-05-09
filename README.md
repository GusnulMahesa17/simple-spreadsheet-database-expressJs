# Spreadsheet Database ExpressJS

## Description
This project demonstrates how to 
use a Google Spreadsheet as a simple database for 
an Express.js application. It allows you to perform basic 
CRUD operations by interacting with the spreadsheet.

## Steps to Run the Project

### Step 1: Copy the Spreadsheet
Make a copy of the provided Google Spreadsheet template into your Google account. Grant editor access to allow CRUD operations. [Spreadsheet Template Link](https://docs.google.com/spreadsheets/d/1rjZftforx9ECfrCeK4ZcO9sx_sZYM7GYwn4oJnKN6H4/edit?gid=0#gid=0)

### Step 2: Set Up Google API Credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Enable the "Google Sheets API" and "Google Drive API" for your project.
4. Create a service account and download the JSON credentials file.
5. Share your copied spreadsheet with the service account email.

### Step 3: Clone the Repository
Clone this repository to your local machine:
```bash
git clone https://github.com/your-username/spreadsheet-database-expressjs.git
cd spreadsheet-database-expressjs
```

### Step 4: Install Dependencies
Install the required dependencies using npm:
```bash
npm install
```

### Step 5: Configure Environment Variables
Create a `.env` file in the root directory and add the following:
```
SPREADSHEET_ID=*Copy the part of the URL after `d/` and before `/edit` from your spreadsheet link.*
GOOGLE_APPLICATION_CREDENTIALS=credentials.json
```

### Step 6: Start the Server
Run the application:
```bash
npm start
```

### Step 7: Access the Application
Open your browser and navigate to `http://localhost:3000`. You can now interact with the spreadsheet as a database.

## Features
- Perform CRUD operations on Google Spreadsheets.