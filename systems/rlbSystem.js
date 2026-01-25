const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const Drops = require('../database/Drops');
const RarityDrop = require('../database/RarityDrop');

async function handleRlbCommand(message) {
  console.log(`[RLB] Command triggered by ${message.author.tag} in ${message.guild.name}`);
  
  const BOT_OWNER_ID = process.env.BOT_OWNER_ID;
  
  // Check permissions
  if (message.author.id !== BOT_OWNER_ID && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    console.log(`[RLB] Permission denied for ${message.author.tag}`);
    return message.reply('❌ You need Administrator permission to use this command.').catch(err => {
      console.error('[RLB] Failed to send permission error:', err.message);
    });
  }

  try {
    const guildId = message.guild.id;
    
    // Get top 10 droppers in this server
    const topDroppers = await Drops.find({ guildId })
      .sort({ drop_count: -1 })
      .limit(10);

    if (topDroppers.length === 0) {
      console.log('[RLB] No drops found for this server');
      return message.channel.send('📊 No drops tracked yet in this server.').catch(err => {
        console.error('[RLB] Failed to send no drops message:', err.message);
      });
    }

    // Build leaderboard embed
    const embed = new EmbedBuilder()
      .setTitle('🎴 Drop Leaderboard')
      .setDescription(`Top droppers in **${message.guild.name}**`)
      .setColor(0x0099ff)
      .setTimestamp();

    let description = '';
    for (let i = 0; i < topDroppers.length; i++) {
      const user = topDroppers[i];
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      description += `${medal} <@${user.userId}> - **${user.drop_count}** drops\n`;
    }

    embed.addFields({ name: 'Rankings', value: description });

    // Add button to view rarity details
    const button = new ButtonBuilder()
      .setCustomId('view_rarity_drops')
      .setLabel('View Rarity Drops')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('💎');

    const row = new ActionRowBuilder().addComponents(button);

    console.log('[RLB] Sending leaderboard...');
    await message.channel.send({ embeds: [embed], components: [row] }).catch(err => {
      console.error('[RLB] Failed to send leaderboard:', err.message);
      message.channel.send('❌ Failed to display leaderboard. Please try again.').catch(() => {});
    });

  } catch (error) {
    console.error('[RLB] Error:', error);
    message.reply('❌ An error occurred while fetching the leaderboard.').catch(err => {
      console.error('[RLB] Failed to send error message:', err.message);
    });
  }
}

async function handleRarityButton(interaction) {
  try {
    const guildId = interaction.guild.id;
    
    // Get top 10 rarity droppers in this server
    const topRarity = await RarityDrop.find({ guildId })
      .sort({ legendary_count: -1, exotic_count: -1 })
      .limit(10);

    if (topRarity.length === 0) {
      return interaction.update({ content: '📊 No Exotic/Legendary drops tracked yet in this server.', embeds: [], components: [] });
    }

    // Build rarity embed
    const embed = new EmbedBuilder()
      .setTitle('💎 Rarity Drop Leaderboard')
      .setDescription(`Top Exotic & Legendary droppers in **${interaction.guild.name}**`)
      .setColor(0xFFD700)
      .setTimestamp();

    let description = '';
    for (let i = 0; i < topRarity.length; i++) {
      const user = topRarity[i];
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      const total = user.legendary_count + user.exotic_count;
      description += `${medal} <@${user.userId}>\n`;
      description += `   🌟 Legendary: **${user.legendary_count}** | 💎 Exotic: **${user.exotic_count}** | Total: **${total}**\n\n`;
    }

    embed.addFields({ name: 'Rankings', value: description });

    // Add back button
    const backButton = new ButtonBuilder()
      .setCustomId('back_to_drops')
      .setLabel('Back to All Drops')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('⬅️');

    const row = new ActionRowBuilder().addComponents(backButton);

    await interaction.update({ embeds: [embed], components: [row] });

  } catch (error) {
    console.error('Error in rarity button:', error);
    await interaction.update({ content: '❌ An error occurred while fetching rarity drops.', embeds: [], components: [] });
  }
}

async function handleBackButton(interaction) {
  try {
    const guildId = interaction.guild.id;
    
    const topDroppers = await Drops.find({ guildId })
      .sort({ drop_count: -1 })
      .limit(10);

    const embed = new EmbedBuilder()
      .setTitle('🎴 Drop Leaderboard')
      .setDescription(`Top droppers in **${interaction.guild.name}**`)
      .setColor(0x0099ff)
      .setTimestamp();

    let description = '';
    for (let i = 0; i < topDroppers.length; i++) {
      const user = topDroppers[i];
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      description += `${medal} <@${user.userId}> - **${user.drop_count}** drops\n`;
    }

    embed.addFields({ name: 'Rankings', value: description });

    const button = new ButtonBuilder()
      .setCustomId('view_rarity_drops')
      .setLabel('View Rarity Drops')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('💎');

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.update({ embeds: [embed], components: [row] });

  } catch (error) {
    console.error('Error in back button:', error);
  }
}

module.exports = { handleRlbCommand, handleRarityButton, handleBackButton };
