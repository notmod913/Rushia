# MongoDB Architecture - Optimized for Fast Read/Write

## Connection Configuration
```javascript
maxPoolSize: 10          // Connection pool for concurrent operations
serverSelectionTimeoutMS: 5000
socketTimeoutMS: 45000
bufferCommands: false    // Fail fast instead of buffering
```

## Collections & Indexes

### 1. Reminders Collection
**Purpose**: Store user reminders for various game events

**Indexes**:
- `{ remindAt: 1 }` - Fast queries for due reminders
- `{ userId: 1, type: 1 }` - Fast user-specific lookups
- `{ userId: 1, cardId: 1 }` (unique, partial) - Prevent duplicate expedition reminders
- `{ userId: 1, type: 1 }` (unique, partial) - Prevent duplicate stamina/raid/drop reminders

**Query Patterns**:
- Find due reminders: `{ remindAt: { $lte: now } }` - Uses remindAt index
- Find user reminders: `{ userId, type }` - Uses compound index
- Upsert operations: Leverages unique indexes for duplicate prevention

### 2. Drops Collection
**Purpose**: Track drop counts per user per server

**Indexes**:
- `{ userId: 1, guildId: 1 }` (unique) - One document per user per server
- `{ guildId: 1, drop_count: -1 }` - Fast leaderboard queries

**Query Patterns**:
- Increment drops: `findOneAndUpdate({ userId, guildId }, { $inc: { drop_count: 1 } })`
- Leaderboard: `find({ guildId }).sort({ drop_count: -1 }).limit(50)`

### 3. RarityDrop Collection
**Purpose**: Track rare drop counts per user per server

**Indexes**:
- `{ userId: 1, guildId: 1 }` (unique) - One document per user per server
- `{ guildId: 1, legendary_count: -1, exotic_count: -1 }` - Fast rarity leaderboard

**Query Patterns**:
- Increment rarity: `findOneAndUpdate({ userId, guildId }, { $inc: { legendary_count: 1 } })`
- Rarity leaderboard: `find({ guildId }).sort({ legendary_count: -1, exotic_count: -1 }).limit(10)`

### 4. UserNotificationSettings Collection
**Purpose**: Store user notification preferences

**Indexes**:
- `{ userId: 1 }` (unique) - One document per user globally

**Query Patterns**:
- Get settings: `findOne({ userId })`
- Update settings: `findOneAndUpdate({ userId }, { $set: { ... } }, { upsert: true })`

### 5. BotSettings Collection
**Purpose**: Store server-specific bot configuration

**Indexes**:
- `{ guildId: 1 }` (unique) - One document per server

**Query Patterns**:
- Get settings: `findOne({ guildId })`
- Update settings: `findOneAndUpdate({ guildId }, { $set: { ... } }, { upsert: true })`

## Performance Optimizations

### 1. Lean Queries
Use `.lean()` for read-only operations to skip Mongoose hydration:
```javascript
await Drops.find({ guildId }).sort({ drop_count: -1 }).limit(50).lean();
```

### 2. Projection
Only fetch needed fields:
```javascript
await Reminder.find({ remindAt: { $lte: now } }, 'userId channelId type reminderMessage');
```

### 3. Bulk Operations
Use `bulkWrite()` for multiple updates:
```javascript
await Drops.bulkWrite([
  { updateOne: { filter: { userId, guildId }, update: { $inc: { drop_count: 1 } }, upsert: true } }
]);
```

### 4. Aggregation Pipeline
For complex leaderboard queries with totals:
```javascript
await Drops.aggregate([
  { $match: { guildId } },
  { $sort: { drop_count: -1 } },
  { $limit: 50 },
  { $group: { _id: null, total: { $sum: '$drop_count' }, users: { $push: '$$ROOT' } } }
]);
```

### 5. TTL Index for Logs
Automatically delete old logs:
```javascript
logSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days
```

## Best Practices

1. **Use upsert for counters**: Prevents race conditions
2. **Compound indexes**: Match query patterns exactly
3. **Partial indexes**: Save space for conditional uniqueness
4. **Lean queries**: 5-10x faster for read-only operations
5. **Connection pooling**: Reuse connections efficiently
6. **Fail fast**: Don't buffer commands when disconnected
7. **Index selectivity**: Most selective field first in compound indexes

## Monitoring

Track these metrics:
- Query execution time
- Index usage: `db.collection.getIndexes()`
- Slow queries: Enable profiling
- Connection pool stats
- Document size (keep under 16MB)

## Scaling Considerations

- **Sharding key**: Use `{ guildId: 1, userId: 1 }` for horizontal scaling
- **Read replicas**: For read-heavy operations
- **Caching**: Add Redis for frequently accessed data (user settings, bot settings)
- **Archiving**: Move old reminders to separate collection
