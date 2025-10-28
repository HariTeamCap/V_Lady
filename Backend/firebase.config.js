import * as dotenv from 'dotenv';
dotenv.config();

export default {
  apiKey: process.env.API_KEY,
  authDomain: process.env.Auth_Domain,
  projectId: process.env.Project_Id,
  storageBucket: process.env.Storage_Bucket,
  messagingSenderId: process.env.Messaging_Sender_Id,
  appId: process.env.App_Id,
  measurementId: process.env.Measurement_Id
};