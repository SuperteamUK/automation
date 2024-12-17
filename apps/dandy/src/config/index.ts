// src/config.ts
import dotenv from 'dotenv';

dotenv.config();

export const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN!;
export const TELEGRAM_SUPPORT_CHANNEL = process.env.SUPPORT_CHAT_ID!;
export const TICKET_CHAT_ID = process.env.TICKET_CHAT_ID!;

export const LUMA_SECRET = process.env.LUMA_SECRET!;

// AIWelcome API configuration
export const AIWELCOME_API_KEY = process.env.AIWELCOME_API_KEY!;
export const AIWELCOME_BASE_URL = process.env.AIWELCOME_BASE_URL!;
export const AIWELCOME_PROJECT_ID = process.env.AIWELCOME_PROJECT_ID!;
export const AIWELCOME_CHAT_ENGINE = process.env.AIWELCOME_CHAT_ENGINE!;
export const AIWELCOME_CHAT_ORIGIN = process.env.AIWELCOME_CHAT_ORIGIN!;

// Rate limiting configuration to prevent abuse
export const RATE_LIMIT_MAX = 50;
export const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
