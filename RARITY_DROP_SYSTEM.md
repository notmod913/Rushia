# Rarity Drop Tracking System

## Overview
Automatically tracks and stores Exotic and Legendary card drops in MongoDB.

## Features
- ✅ Detects Exotic and Legendary card drops from Luvi bot
- ✅ Extracts user information from embed footer (avatar URL → user ID)
- ✅ Stores drop data in dedicated "rarity" collection
- ✅ Tracks: user, card name, series, rarity, guild, channel, timestamp
- ✅ Comprehensive logging for all drops

## Files Created

### Database
- `database/RarityDrop.js` - MongoDB schema for rarity drops

### Systems
- `systems/rarityDropSystem.js` - Main tracking system

### Scripts
- `setupRarityCollection.js` - Initialize database collection
- `viewRarityDrops.js` - View stored drops

### Updated Files
- `utils/embedParser.js` - Enhanced to extract user info from footer
- `events/messageCreate.js` - Integrated rarity drop system

## Database Schema

```javascript
{
  userId: String,        // Extracted from avatar URL
  username: String,      // From embed footer text
  avatarUrl: String,     // User's profile picture URL
  cardName: String,      // Card name
  seriesName: String,    // Series name
  rarity: String,        // "Exotic" or "Legendary"
  guildId: String,       // Server ID
  channelId: String,     // Channel ID
  messageUrl: String,    // Link to drop message
  droppedAt: Date        // Timestamp
}
```

## How It Works

1. User uses `/drop` command
2. Luvi bot responds with card embed
3. Embed footer contains username and avatar URL
4. System extracts user ID from avatar URL pattern: `avatars/{USER_ID}/...`
5. If rarity is Exotic or Legendary → Store in database
6. Log the drop event

## Usage

### Setup Collection
```bash
node setupRarityCollection.js
```

### View Drops
```bash
node viewRarityDrops.js
```

### Query Examples

```javascript
// Get all drops by user
await RarityDrop.find({ userId: '123456789' });

// Get legendary drops only
await RarityDrop.find({ rarity: 'Legendary' });

// Get drops in specific guild
await RarityDrop.find({ guildId: '987654321' });

// Get recent drops (last 24 hours)
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
await RarityDrop.find({ droppedAt: { $gte: yesterday } });
```

## Indexes

- `userId` - Fast user lookups
- `guildId` - Fast guild lookups
- `droppedAt` - Fast time-based queries
- Compound: `guildId + rarity + droppedAt` - Optimized guild stats
- Compound: `userId + droppedAt` - Optimized user history

## Notes

- Only Exotic and Legendary drops are stored (not Common/Uncommon/Rare)
- User ID extraction requires avatar URL in footer
- Messages older than 60 seconds are ignored
- Duplicate prevention handled by MongoDB
