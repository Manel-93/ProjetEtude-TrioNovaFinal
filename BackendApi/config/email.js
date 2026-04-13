import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const emailFrom = process.env.EMAIL_FROM || 'noreply@trionova.com';

