import dotenv from 'dotenv';

dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  emailConfirmExpiresIn: process.env.JWT_EMAIL_CONFIRM_EXPIRES_IN || '24h',
  passwordResetExpiresIn: process.env.JWT_PASSWORD_RESET_EXPIRES_IN || '1h'
};

