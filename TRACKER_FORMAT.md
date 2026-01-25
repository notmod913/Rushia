# Rarity Drop Tracker - Storage Format

## One Document Per User

Each user gets **ONE document** that tracks their total Exotic and Legendary drops.

## Sample Document

```json
{
  "_id": "679abcd1234567890abcdef0",
  "userId": "587709425708695552",
  "username": "YourUsername",
  "avatarUrl": "https://cdn.discordapp.com/avatars/587709425708695552/abc123.png",
  "legendary_count": 15,
  "exotic_count": 42,
  "droppedAt": "2026-01-24T14:30:45.123Z"
}
```

## Field Breakdown

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `_id` | ObjectId | `679abcd...` | MongoDB auto-generated ID |
| `userId` | String | `587709425708695552` | Discord user ID (unique) |
| `username` | String | `YourUsername` | Current username |
| `avatarUrl` | String | `https://cdn.discordapp.com/...` | Current avatar URL |
| `legendary_count` | Number | `15` | Total Legendary drops |
| `exotic_count` | Number | `42` | Total Exotic drops |
| `droppedAt` | Date | `2026-01-24T14:30:45.123Z` | Last drop timestamp |

## How It Works

### First Drop:
User drops a Legendary card → Document created:
```json
{
  "userId": "123456789",
  "username": "Player1",
  "avatarUrl": "https://...",
  "legendary_count": 1,
  "exotic_count": 0,
  "droppedAt": "2026-01-24T10:00:00.000Z"
}
```

### Second Drop (Exotic):
Same user drops an Exotic card → Document updated:
```json
{
  "userId": "123456789",
  "username": "Player1",
  "avatarUrl": "https://...",
  "legendary_count": 1,
  "exotic_count": 1,
  "droppedAt": "2026-01-24T11:00:00.000Z"
}
```

### Third Drop (Legendary):
Same user drops another Legendary → Count incremented:
```json
{
  "userId": "123456789",
  "username": "Player1",
  "avatarUrl": "https://...",
  "legendary_count": 2,
  "exotic_count": 1,
  "droppedAt": "2026-01-24T12:00:00.000Z"
}
```

## Multiple Users Example

```json
[
  {
    "_id": "679abc001",
    "userId": "123456789",
    "username": "Player1",
    "avatarUrl": "https://cdn.discordapp.com/avatars/123456789/abc.png",
    "legendary_count": 5,
    "exotic_count": 12,
    "droppedAt": "2026-01-24T14:30:00.000Z"
  },
  {
    "_id": "679abc002",
    "userId": "987654321",
    "username": "Player2",
    "avatarUrl": "https://cdn.discordapp.com/avatars/987654321/xyz.png",
    "legendary_count": 3,
    "exotic_count": 8,
    "droppedAt": "2026-01-24T13:15:00.000Z"
  },
  {
    "_id": "679abc003",
    "userId": "555555555",
    "username": "Player3",
    "avatarUrl": "https://cdn.discordapp.com/avatars/555555555/def.png",
    "legendary_count": 10,
    "exotic_count": 25,
    "droppedAt": "2026-01-24T15:00:00.000Z"
  }
]
```

## Database Operations

### When a drop is detected:

```javascript
// If Legendary drop
await RarityDrop.findOneAndUpdate(
  { userId: "123456789" },
  {
    $inc: { legendary_count: 1 },
    $set: {
      username: "Player1",
      avatarUrl: "https://...",
      droppedAt: new Date()
    }
  },
  { upsert: true, new: true }
);
```

### Query Examples:

```javascript
// Get top droppers
await RarityDrop.find()
  .sort({ legendary_count: -1, exotic_count: -1 })
  .limit(10);

// Get specific user stats
await RarityDrop.findOne({ userId: "123456789" });

// Get total drops across all users
await RarityDrop.aggregate([
  {
    $group: {
      _id: null,
      totalLegendary: { $sum: '$legendary_count' },
      totalExotic: { $sum: '$exotic_count' }
    }
  }
]);

// Get users with most legendary drops
await RarityDrop.find({ legendary_count: { $gte: 10 } })
  .sort({ legendary_count: -1 });
```

## Benefits

✅ **One document per user** - Clean and efficient
✅ **Automatic counting** - No manual calculation needed
✅ **Updated username/avatar** - Always shows current info
✅ **Last drop timestamp** - Track activity
✅ **Fast queries** - Indexed on userId
✅ **Leaderboard ready** - Easy to sort by counts
