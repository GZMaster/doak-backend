/* eslint-disable node/no-missing-require */
/* eslint-disable import/no-unresolved */
const { initializeApp } = require("firebase/app");
const { getFirestore, collection } = require("firebase/firestore");
// eslint-disable-next-line node/no-unpublished-require
// const serviceAccount = require("./serviceAccountKey.json");

const {
  API_KEY,
  AUTH_DOMAIN,
  DATABASE_URL,
  PROJECT_ID,
  STORAGE_BUCKET,
  MESSAGING_SENDER_ID,
  APP_ID,
} = process.env;

const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  databaseURL: DATABASE_URL,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MESSAGING_SENDER_ID,
  appId: APP_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
// Create a reference to the database
const db = getFirestore(firebaseApp);

const docRef = collection(db, "wineProducts");

module.exports = { firebaseApp, db, docRef };
