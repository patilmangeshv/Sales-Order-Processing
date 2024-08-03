# Sales-Order-Processing
The application is platform independence and has two parts - Salesperson/Customer View (salesperson or customer can browse through the products posted by the seller and select the items to purchase); Administration Panel (In this, the seller can add any new products, set its MRP, selling price, the available stock quantity, etc.)

## Technologies
### Frontend: Angular (9)
### Backend: Firebase (Authentication, Firestore, Storage)

## Features

List some key features of your application here, highlighting how they utilize Firebase functionalities.

## Prerequisites:

Node.js and npm (or yarn): https://nodejs.org/

## Firebase Setup:

1. Create a Firebase project and configure your web app in the Firebase console: https://console.firebase.google.com/
2. Install the Firebase CLI globally: ```npm install -g firebase-tools```
3. Login to Firebase in your terminal: ```firebase login```
4. Initialize your project with Firebase: ```firebase init``` (Follow the prompts and select the desired Firebase services)

## Running the Application:

1. Clone this repository.
2. Open a terminal window in the project root directory.
3. Install dependencies: ```npm install``` (or ```yarn install```)
4. Start the development server: ```ng serve``` (This will serve the Angular application on ```http://localhost:4200``` by default)

## Building the application for production:

1. Frontend:
Run: ```ng build --prod``` (This will generate optimized production build)
2. Firebase Hosting:
You can deploy your Angular application to Firebase Hosting using the Firebase CLI: ```firebase deploy```
Remember to configure Firebase Hosting settings in your project.

## Folder Structure

```
├── src (Angular application)
│   ├── app (Angular application components, services, etc.)
│   ├── environments (Environment configuration files)
│   ├── ... (Other Angular application files)
├── firebase.json (Firebase project configuration)
├── README.md (This file)
```