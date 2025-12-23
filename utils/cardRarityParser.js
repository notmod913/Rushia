const RARITY_ORDER = ['Mythical', 'Legendary', 'Exotic', 'Rare', 'Uncommon', 'Common'];

const RARITY_CODE_MAP = {
    'M': 'Mythical',
    'L': 'Legendary',
    'E': 'Exotic',
    'R': 'Rare',
    'UC': 'Uncommon',
    'C': 'Common'
};

const GRADE_MAP = {
    'SPlusTier': 'S+',
    'STier': 'S',
    'ATier': 'A',
    'BTier': 'B',
    'CTier': 'C',
    'DTier': 'D'
};

function extractCardsFromEmbed(embed) {
    const cards = {};
    if (!embed.fields) return cards;

    embed.fields.forEach(field => {
        const nameMatch = field.name.match(/<:LU_([MLEURC]+):[^>]+>\s*([^|]+?)(?:\s*\|.*)?$/);
        if (nameMatch) {
            const rarityCode = nameMatch[1];
            const cardName = nameMatch[2].trim().replace(/🔒/g, '').replace(/\s+/g, ' ').trim();
            const rarity = RARITY_CODE_MAP[rarityCode];
            
            let grade = '';
            const gradeMatch = field.value.match(/:LU_(SPlusTier|STier|ATier|BTier|CTier|DTier):/);
            if (gradeMatch) {
                grade = GRADE_MAP[gradeMatch[1]];
            }
            
            if (rarity) {
                if (!cards[rarity]) cards[rarity] = [];
                cards[rarity].push({ name: cardName, grade });
            }
        }
    });
    return cards;
}

function buildRarityMessage(cards) {
    const rarities = RARITY_ORDER.filter(r => cards[r]?.length > 0);
    if (rarities.length === 0) return 'No cards found.';
    return rarities.map(rarity => {
        const cardList = cards[rarity].map(card => card.grade ? `${card.name}[${card.grade}]` : card.name).join(', ');
        return `**${rarity}**\n${cardList}`;
    }).join('\n');
}

module.exports = { extractCardsFromEmbed, buildRarityMessage };
