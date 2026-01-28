const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const Drops = require('../database/Drops');
const RarityDrop = require('../database/RarityDrop');

async function handleRlbCommand(message) {
  const BOT_OWNER_ID = process.env.BOT_OWNER_ID;
  const isOwner = message.author.id === BOT_OWNER_ID;

  try {
    const guildId = message.guild.id;
    
    // Get all droppers in this server
    const allDroppers = await Drops.find({ guildId })
      .sort({ drop_count: -1 });

    if (allDroppers.length === 0) {
      return message.channel.send('📊 No drops tracked yet in this server.').catch(() => {});
    }

    // Show top 10 for admins, paginated for owner
    const limit = isOwner ? Math.min(allDroppers.length, 50) : 10;
    const topDroppers = allDroppers.slice(0, limit);
    const totalDrops = allDroppers.reduce((sum, user) => sum + user.drop_count, 0);

    // Build leaderboard embed
    const totalParticipants = allDroppers.length;
    
    const embed = new EmbedBuilder()
      .setAuthor({ 
        name: message.guild.name, 
        iconURL: message.guild.iconURL({ dynamic: true }) 
      })
      .setTitle('🎴 Drop Leaderboard')
      .setThumbnail('https://cdn.discordapp.com/attachments/1446564927983849593/1466067284530434181/image0.gif')
      .setColor(0x0099ff);

    let rankings = '`S.No` • `Drops` • `User`\n';
    const maxDrops = Math.max(...topDroppers.map(u => u.drop_count));
    const maxWidth = Math.max(maxDrops.toString().length, 5);
    for (let i = 0; i < topDroppers.length; i++) {
      const user = topDroppers[i];
      const rank = `${i + 1}]`.padEnd(4, ' ');
      const drops = user.drop_count.toString().padStart(maxWidth, ' ');
      rankings += `\`${rank}\` • \`${drops}\` • <@${user.userId}>\n`;
    }
    embed.addFields({ name: '\u200b', value: rankings });
    embed.setFooter({ text: `Participants: ${totalParticipants} | Total Drops: ${totalDrops}` });

    // Add buttons
    const rarityButton = new ButtonBuilder()
      .setCustomId(`view_rarity_drops_${message.author.id}`)
      .setLabel('Rare Drops')
      .setStyle(ButtonStyle.Primary);

    const resetButton = new ButtonBuilder()
      .setCustomId(`reset_drops_${message.author.id}`)
      .setLabel('Reset')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔄')
      .setDisabled(!isOwner && !message.member.permissions.has(PermissionFlagsBits.Administrator));

    const components = [rarityButton, resetButton];

    // Add pagination for owner if more than 50 entries
    if (isOwner && allDroppers.length > 50) {
      const nextButton = new ButtonBuilder()
        .setCustomId('rlb_next_0')
        .setLabel('Next')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('▶️');
      components.push(nextButton);
    }

    const row = new ActionRowBuilder().addComponents(components);

    await message.channel.send({ embeds: [embed], components: [row] }).catch(() => {});

  } catch (error) {
    message.reply('❌ An error occurred while fetching the leaderboard.').catch(() => {});
  }
}

async function handleRarityButton(interaction) {
  try {
    const allowedUserId = interaction.customId.split('_')[3];
    if (interaction.user.id !== allowedUserId) {
      return interaction.reply({ content: 'Dont click 😭', ephemeral: true });
    }

    const guildId = interaction.guild.id;
    
    // Get top 10 rarity droppers in this server
    const topRarity = await RarityDrop.find({ guildId })
      .sort({ legendary_count: -1, exotic_count: -1 })
      .limit(10);

    if (topRarity.length === 0) {
      const embed = new EmbedBuilder()
        .setAuthor({ 
          name: interaction.guild.name, 
          iconURL: interaction.guild.iconURL({ dynamic: true }) 
        })
        .setTitle('💎 Rarity Drop Leaderboard')
        .setDescription('📊 No Exotic/Legendary drops tracked yet in this server.')
        .setColor(0xFFD700)
        .setTimestamp();

      const backButton = new ButtonBuilder()
        .setCustomId(`back_to_drops_${interaction.user.id}`)
        .setLabel('Back')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⬅️');

      const resetButton = new ButtonBuilder()
        .setCustomId(`reset_drops_${interaction.user.id}`)
        .setLabel('Reset')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔄')
        .setDisabled(true);

      const row = new ActionRowBuilder().addComponents(backButton, resetButton);

      return interaction.update({ embeds: [embed], components: [row] });
    }

    // Build rarity embed
    const allRarity = await RarityDrop.find({ guildId });
    const totalLegendary = allRarity.reduce((sum, user) => sum + user.legendary_count, 0);
    const totalExotic = allRarity.reduce((sum, user) => sum + user.exotic_count, 0);

    const embed = new EmbedBuilder()
      .setAuthor({ 
        name: interaction.guild.name, 
        iconURL: interaction.guild.iconURL({ dynamic: true }) 
      })
      .setTitle('💎 Rarity Drop Leaderboard')
      .setColor(0xFFD700)
      .setTimestamp();

    let rankings = '`S.No` • <:exotic:1465638346670735410> • <:legendary:1465638343797903600> • `User`\n';
    const maxExotic = Math.max(...topRarity.map(u => u.exotic_count));
    const maxLegendary = Math.max(...topRarity.map(u => u.legendary_count));
    const exoticWidth = Math.max(maxExotic.toString().length, 3);
    const legendaryWidth = Math.max(maxLegendary.toString().length, 3);
    for (let i = 0; i < topRarity.length; i++) {
      const user = topRarity[i];
      const rank = `${i + 1}]`.padEnd(4, ' ');
      const exotic = user.exotic_count.toString().padStart(exoticWidth, ' ');
      const legendary = user.legendary_count.toString().padStart(legendaryWidth, ' ');
      rankings += `\`${rank}\` • \`${exotic}\` • \`${legendary}\` • <@${user.userId}>\n`;
    }
    embed.addFields({ name: '\u200b', value: rankings });
    embed.setFooter({ text: `Total: ${totalExotic} Exotic | ${totalLegendary} Legendary` });

    // Add back button
    const backButton = new ButtonBuilder()
      .setCustomId(`back_to_drops_${interaction.user.id}`)
      .setLabel('Back')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('⬅️');

    const row = new ActionRowBuilder().addComponents(backButton);

    await interaction.update({ embeds: [embed], components: [row] });

  } catch (error) {
    await interaction.update({ content: '❌ An error occurred while fetching rarity drops.', embeds: [], components: [] });
  }
}

async function handleBackButton(interaction) {
  try {
    const allowedUserId = interaction.customId.split('_')[3];
    if (interaction.user.id !== allowedUserId) {
      return interaction.reply({ content: 'Dont click 😭', ephemeral: true });
    }

    const guildId = interaction.guild.id;
    
    const topDroppers = await Drops.find({ guildId })
      .sort({ drop_count: -1 })
      .limit(10);

    const allDrops = await Drops.find({ guildId });
    const totalDrops = allDrops.reduce((sum, user) => sum + user.drop_count, 0);

    const embed = new EmbedBuilder()
      .setAuthor({ 
        name: interaction.guild.name, 
        iconURL: interaction.guild.iconURL({ dynamic: true }) 
      })
      .setTitle('🎴 Drop Leaderboard')
      .setThumbnail('https://cdn.discordapp.com/attachments/1446564927983849593/1466067284530434181/image0.gif')
      .setColor(0x0099ff);

    let rankings = '`S.No` • `Drops` • `User`\n';
    const maxDrops = Math.max(...topDroppers.map(u => u.drop_count));
    const maxWidth = Math.max(maxDrops.toString().length, 5);
    for (let i = 0; i < topDroppers.length; i++) {
      const user = topDroppers[i];
      const rank = `${i + 1}]`.padEnd(4, ' ');
      const drops = user.drop_count.toString().padStart(maxWidth, ' ');
      rankings += `\`${rank}\` • \`${drops}\` • <@${user.userId}>\n`;
    }
    embed.addFields({ name: '\u200b', value: rankings });
    embed.setFooter({ text: `👥 Participants: ${allDrops.length} | 🎴 Total Drops: ${totalDrops}` });

    const button = new ButtonBuilder()
      .setCustomId(`view_rarity_drops_${interaction.user.id}`)
      .setLabel('Rare Drops')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.update({ embeds: [embed], components: [row] });

  } catch (error) {
    // Silent fail
  }
}

async function handleResetButton(interaction) {
  try {
    const allowedUserId = interaction.customId.split('_')[2];
    if (interaction.user.id !== allowedUserId) {
      return interaction.reply({ content: 'Dont click 😭', ephemeral: true });
    }

    const BOT_OWNER_ID = process.env.BOT_OWNER_ID;
    
    // Only bot owner or admin can reset
    if (interaction.user.id !== BOT_OWNER_ID && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Only the bot owner or server administrators can reset the leaderboard.', ephemeral: true });
    }

    // Show confirmation buttons
    const yesButton = new ButtonBuilder()
      .setCustomId(`confirm_reset_${interaction.guild.id}`)
      .setLabel('Yes')
      .setStyle(ButtonStyle.Danger);

    const noButton = new ButtonBuilder()
      .setCustomId('cancel_reset')
      .setLabel('No')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(yesButton, noButton);

    await interaction.reply({ 
      content: '⚠️ Are you sure you want to reset all drop data for this server? This action cannot be undone.', 
      components: [row],
      ephemeral: true 
    });

  } catch (error) {
    await interaction.reply({ content: '❌ An error occurred while resetting.', ephemeral: true });
  }
}

async function handleConfirmReset(interaction) {
  try {
    const guildId = interaction.customId.split('_')[2];
    
    // Delete all drops for this server
    await Drops.deleteMany({ guildId });
    await RarityDrop.deleteMany({ guildId });

    await interaction.update({ 
      content: '✅ Leaderboard has been reset to 0 for this server.', 
      components: []
    });

  } catch (error) {
    await interaction.update({ content: '❌ An error occurred while resetting.', components: [] });
  }
}

async function handleCancelReset(interaction) {
  await interaction.update({ content: '❌ Reset cancelled.', components: [] });
}

module.exports = { handleRlbCommand, handleRarityButton, handleBackButton, handleResetButton, handleConfirmReset, handleCancelReset };
