# Sample Rarity Drop Storage

## MongoDB Document Structure

When a user drops an Exotic or Legendary card, this is what gets stored in the `rarity` collection:

```json
{
  "_id": "679abcd1234567890abcdef0",
  "userId": "587709425708695552",
  "username": "YourUsername",
  "avatarUrl": "https://cdn.discordapp.com/avatars/587709425708695552/a1b2c3d4e5f6g7h8i9j0k1l2.png",
  "cardName": "Gojo Satoru",
  "seriesName": "Jujutsu Kaisen",
  "rarity": "Legendary",
  "guildId": "597328712257503233",
  "channelId": "1446564927983849593",
  "messageUrl": "https://discord.com/channels/597328712257503233/1446564927983849593/1234567890123456789",
  "droppedAt": "2026-01-24T14:30:45.123Z",
  "__v": 0
}
```

## Field Breakdown

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `_id` | ObjectId | `679abcd...` | MongoDB auto-generated ID |
| `userId` | String | `587709425708695552` | Discord user ID (extracted from avatar URL) |
| `username` | String | `YourUsername` | Username from embed footer |
| `avatarUrl` | String | `https://cdn.discordapp.com/avatars/...` | User's profile picture URL |
| `cardName` | String | `Gojo Satoru` | Name of the card dropped |
| `seriesName` | String | `Jujutsu Kaisen` | Series the card belongs to |
| `rarity` | String | `Legendary` or `Exotic` | Card rarity (only these two are stored) |
| `guildId` | String | `597328712257503233` | Discord server ID where drop occurred |
| `channelId` | String | `1446564927983849593` | Channel ID where drop occurred |
| `messageUrl` | String | `https://discord.com/channels/...` | Direct link to the drop message |
| `droppedAt` | Date | `2026-01-24T14:30:45.123Z` | Timestamp when card was dropped |
| `__v` | Number | `0` | MongoDB version key |

## Multiple Documents Example

```json
[
  {
    "_id": "679abc001",
    "userId": "123456789",
    "username": "Player1",
    "avatarUrl": "https://cdn.discordapp.com/avatars/123456789/abc123.png",
    "cardName": "Naruto Uzumaki",
    "seriesName": "Naruto",
    "rarity": "Exotic",
    "guildId": "597328712257503233",
    "channelId": "1446564927983849593",
    "messageUrl": "https://discord.com/channels/597328712257503233/1446564927983849593/111111",
    "droppedAt": "2026-01-24T10:15:30.000Z"
  },
  {
    "_id": "679abc002",
    "userId": "987654321",
    "username": "Player2",
    "avatarUrl": "https://cdn.discordapp.com/avatars/987654321/xyz789.png",
    "cardName": "Luffy",
    "seriesName": "One Piece",
    "rarity": "Legendary",
    "guildId": "597328712257503233",
    "channelId": "1446564927983849593",
    "messageUrl": "https://discord.com/channels/597328712257503233/1446564927983849593/222222",
    "droppedAt": "2026-01-24T11:20:45.000Z"
  },
  {
    "_id": "679abc003",
    "userId": "123456789",
    "username": "Player1",
    "avatarUrl": "https://cdn.discordapp.com/avatars/123456789/abc123.png",
    "cardName": "Gojo Satoru",
    "seriesName": "Jujutsu Kaisen",
    "rarity": "Legendary",
    "guildId": "597328712257503233",
    "channelId": "1446564927983849593",
    "messageUrl": "https://discord.com/channels/597328712257503233/1446564927983849593/333333",
    "droppedAt": "2026-01-24T14:30:45.000Z"
  }
]
```

## How Data is Extracted

### From Discord Embed:

**Embed Footer:**
```
Text: "YourUsername"
Icon URL: "https://cdn.discordapp.com/avatars/587709425708695552/a1b2c3d4.png"
```

**Embed Description:**
```
<:LU_L:123456> **Gojo Satoru**
Series: Jujutsu Kaisen
```

### Extraction Process:

1. **userId**: Regex match on avatar URL → `avatars/(\d+)/` → `587709425708695552`
2. **username**: Direct from footer text → `YourUsername`
3. **avatarUrl**: Direct from footer icon URL
4. **cardName**: Regex match on bold text → `\*\*(.+?)\*\*` → `Gojo Satoru`
5. **seriesName**: Regex match after "Series:" → `Jujutsu Kaisen`
6. **rarity**: Emoji code mapping → `:LU_L:` → `Legendary`
7. **guildId**: From `message.guild.id`
8. **channelId**: From `message.channel.id`
9. **messageUrl**: From `message.url`
10. **droppedAt**: Current timestamp → `new Date()`

## Query Examples

### Get all drops by a user:
```javascript
db.rarity.find({ userId: "587709425708695552" })
```

### Get only Legendary drops:
```javascript
db.rarity.find({ rarity: "Legendary" })
```

### Get drops from last 24 hours:
```javascript
db.rarity.find({ 
  droppedAt: { 
    $gte: new Date(Date.now() - 24*60*60*1000) 
  } 
})
```

### Count drops per user:
```javascript
db.rarity.aggregate([
  { $group: { _id: "$userId", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

### Get top cards dropped:
```javascript
db.rarity.aggregate([
  { $group: { _id: "$cardName", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 }
])
```
