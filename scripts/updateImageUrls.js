const fs = require('fs');
const path = require('path');

const cardsPath = path.join(__dirname, '..', 'cards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

cards.forEach(card => {
    if (card.image_url && !card.image_url.startsWith('http')) {
        card.image_url = `https://luvi-game.com${card.image_url}`;
    }
});

fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 4));
console.log(`✅ Updated ${cards.length} card image URLs`);
