function extractIdsFromEmbed(embed) {
  const ids = [];
  
  // From inventory embed (fields)
  if (embed.fields && embed.fields.length > 0) {
    embed.fields.forEach((field) => {
      const valueMatch = field.value.match(/ID:\s*`(\d+)`/);
      if (valueMatch) {
        ids.push(valueMatch[1]);
      }
    });
  }
  
  // From team/other embed (description)
  if (embed.description) {
    const matches = embed.description.match(/ID:\s*`(\d+)`/g);
    if (matches) {
      matches.forEach(match => {
        const id = match.match(/\d+/)[0];
        if (!ids.includes(id)) {
          ids.push(id);
        }
      });
    }
  }
  
  return ids;
}

async function handleIDExtractorReaction(reaction, user) {
  const message = reaction.message;
  if (!message.embeds.length) return;
  const embed = message.embeds[0];
  
  try {
    await reaction.users.remove(user);
    await reaction.users.remove(reaction.client.user);
  } catch (error) {
    console.error('Failed to remove reactions:', error);
  }
  
  const ids = extractIdsFromEmbed(embed);
  if (!ids.length) return;
  
  try {
    await message.channel.send(ids.join(','));
  } catch (error) {
    console.error('Failed to send ID list:', error);
  }
}

module.exports = {
  handleIDExtractorReaction,
  extractIdsFromEmbed
};
