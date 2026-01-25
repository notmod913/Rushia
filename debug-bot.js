require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log('Usage: @bot <message_id>');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.mentions.has(client.user)) return;

  const args = message.content.replace(`<@${client.user.id}>`, '').trim().split(' ');
  const messageId = args[0];
  
  if (!messageId) {
    await message.reply('Usage: `@bot <message_id>`');
    return;
  }
  
  try {
    const targetMsg = await message.channel.messages.fetch(messageId);
    console.log('\n=== MESSAGE DEBUG ===');
    console.log('Author:', targetMsg.author.tag, targetMsg.author.id);
    console.log('Content:', targetMsg.content);
    console.log('Embeds:', targetMsg.embeds.length);
    if (targetMsg.embeds.length > 0) {
      console.log('\nEmbed Structure:', JSON.stringify(targetMsg.embeds[0], null, 2));
    }
    console.log('\nInteraction Metadata:', targetMsg.interactionMetadata);
    console.log('Interaction:', targetMsg.interaction);
    console.log('=== END DEBUG ===\n');
    await message.reply('✅ Check terminal for message structure');
  } catch (error) {
    await message.reply(`❌ Error: ${error.message}`);
  }
});

client.login(process.env.BOT_TOKEN);
