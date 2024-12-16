// src/app.ts
import { startBot } from './bot';

async function main() {
  try {
    startBot();
  } catch (error) {
    console.error('Error starting the application:', error);
    process.exit(1);
  }
}

main();
