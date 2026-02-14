const Reminder = require('../database/Reminder');
const { getUserSettings } = require('../utils/userSettingsManager');
const { sendLog, sendError } = require('../utils/logger');

const LUVI_ID = '1269481871021047891';

/**
 * Detects drop command usage and sets reminder
 */
async function detectAndSetDropReminder(message) {
  if (!message.guild || message.author.id !== LUVI_ID) return;
  if (Date.now() - message.createdTimestamp > 60000) return;
  if (!message.embeds.length) return;

  const embed = message.embeds[0];
  if (!embed.title || !embed.title.toLowerCase().includes('dropped')) return;

  // Extract userId from footer iconURL (Discord.js uses camelCase)
  const footer = embed.footer || embed.data?.footer;
  const iconUrl = footer?.iconURL || footer?.icon_url;
  const userId = iconUrl?.match(/avatars\/(\d+)\//)?.[1];
  if (!userId) return;

  const oneHour = 60 * 60 * 1000;
  const remindAt = new Date(Date.now() + oneHour);

  try {
    await Reminder.create({
      userId,
      channelId: message.channel.id,
      remindAt,
      type: 'drop',
      reminderMessage: `<@${userId}>, You can now use </drop:1472170029905874977> again!`
    });
    
    await sendLog(`[DROP REMINDER SET] User: ${userId}, Channel: ${message.channel.id}, Message: ${message.url}`, {
      category: 'DROP',
      userId,
      guildId: message.guild.id,
      channelId: message.channel.id
    });
  } catch (error) {
    if (error.code === 11000) {
      await sendLog(`[DROP] Duplicate reminder skipped - User already has active reminder`, {
        category: 'DROP',
        userId,
        guildId: message.guild.id,
        channelId: message.channel.id,
        reason: 'duplicate'
      });
    } else {
      await sendError(`[DROP] Failed to create reminder: ${error.message}`, {
        category: 'DROP',
        userId,
        guildId: message.guild.id,
        channelId: message.channel.id,
        error: error.stack
      });
    }
  }
}

module.exports = { processDropMessage: detectAndSetDropReminder };
