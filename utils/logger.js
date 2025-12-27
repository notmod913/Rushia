so const { WebhookClient } = require('discord.js');
const mongoose = require('mongoose');

const logWebhook = process.env.LOG_WEBHOOK_URL ? new WebhookClient({ url: process.env.LOG_WEBHOOK_URL }) : null;
const errorWebhook = process.env.ERROR_WEBHOOK_URL ? new WebhookClient({ url: process.env.ERROR_WEBHOOK_URL }) : null;

let Log = null;
let logsConnection = null;

// Initialize logs database connection
async function initializeLogsDB() {
  if (!process.env.LOGS_URI) return;

  try {
    // Create connection object and explicitly open the URI so we can await it.
    logsConnection = mongoose.createConnection();
    await logsConnection.openUri(process.env.LOGS_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // keep bufferCommands:false if you want immediate failure on writes before connect.
      // If you prefer writes to be buffered, set this to true.
      bufferCommands: false
    });

    const logSchema = new mongoose.Schema({
      level: { type: String, required: true, enum: ['INFO', 'ERROR', 'WARN', 'DEBUG'] },
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      guildId: { type: String },
      userId: { type: String },
      channelId: { type: String },
      metadata: { type: Object }
    });
    logSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });
    Log = logsConnection.model('Log', logSchema);

    console.log('✅ Logs DB connected');
  } catch (error) {
    console.error('Failed to initialize logs database:', error);
  }
}

async function saveLogToDB(level, message, metadata = {}) {
  // If we don't have a model or connection, skip saving to DB
  if (!Log || !logsConnection) return;

  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (logsConnection.readyState !== 1) {
    // Connection not ready. Drop or buffer the log here as desired.
    console.warn('Logs DB not connected yet — skipping DB log:', message);
    return;
  }

  try {
    await Log.create({
      level,
      message,
      ...metadata
    });
  } catch (error) {
    console.error('Failed to save log to database:', error);
  }
}

async function sendLog(message, metadata = {}) {
  await saveLogToDB('INFO', message, metadata);

  if (logWebhook) {
    try {
      await logWebhook.send(message);
    } catch (error) {
      // Silent fail for webhook errors
    }
  }
}

async function sendError(message, metadata = {}) {
  await saveLogToDB('ERROR', message, metadata);

  if (errorWebhook) {
    try {
      await errorWebhook.send(message);
    } catch (error) {
      // Silent fail for webhook errors
    }
  }
}

async function sendWarn(message, metadata = {}) {
  await saveLogToDB('WARN', message, metadata);
}

async function sendDebug(message, metadata = {}) {
  await saveLogToDB('DEBUG', message, metadata);
}

module.exports = { sendLog, sendError, sendWarn, sendDebug, initializeLogsDB };
