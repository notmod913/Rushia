const { extractCardsFromEmbed, buildRarityMessage } = require('../utils/cardRarityParser');
const { startPaginationWatcher } = require('../systems/cardInventorySystem');

module.exports = {
    name: 'messageReactionAdd',
    async execute(reaction, user) {
        if (user.bot) return;
        if (reaction.emoji.name !== '✏️') return;

        try {
            await reaction.message.fetch();
            const embed = reaction.message.embeds[0];
            if (!embed || !embed.title) return;

            const embedUsername = embed.title.match(/<:LU_Inventory:[^>]+>\s*(.+?)'s Inventory/)?.[1];
            if (!embedUsername || embedUsername !== user.username) return;

            const cards = extractCardsFromEmbed(embed);
            if (Object.keys(cards).length === 0) return;

            const message = buildRarityMessage(cards);
            const cardListMessage = await reaction.message.reply({ content: message });
            
            startPaginationWatcher(user.id, reaction.message, cardListMessage);
        } catch (error) {
            console.error('Error handling card reaction:', error);
        }
    }
};
