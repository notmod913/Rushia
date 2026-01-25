const mongoose = require('mongoose');

const botSettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },

  // Legacy single role system
  bossRoleId: { type: String },
  
  // Multi-role system
  multiRoleEnabled: { type: Boolean, default: false },
  
  // Boss tier roles
  tier1RoleId: { type: String },
  tier2RoleId: { type: String },
  tier3RoleId: { type: String }
});

module.exports = mongoose.model('BotSettings', botSettingsSchema, 'guilds');
