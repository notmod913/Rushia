const mongoose = require('mongoose');

const dropsSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  guildId: { type: String, required: true, index: true },
  drop_count: { type: Number, default: 0 },
  droppedAt: { type: Date, default: Date.now }
});

// Compound unique index: one document per user per server
dropsSchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.model('Drops', dropsSchema, 'drops');
