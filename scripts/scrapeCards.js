const fs = require('fs');
const https = require('https');
const path = require('path');

const BASE_URL = 'https://luvi-game.com/api/cards/browse';
const TOTAL_PAGES = 14;
const LIMIT = 100;

async function fetchPage(page) {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}?page=${page}&limit=${LIMIT}`;
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };
        
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}

async function scrapeAllCards() {
    const allCards = [];
    
    for (let page = 1; page <= TOTAL_PAGES; page++) {
        try {
            console.log(`Fetching page ${page}/${TOTAL_PAGES}...`);
            const response = await fetchPage(page);
            
            let cards = response.data || response.cards || response || [];
            if (!Array.isArray(cards)) {
                cards = Object.values(cards).flat();
            }
            
            cards.forEach(card => {
                if (card.name) {
                    allCards.push({
                        name: card.name,
                        series: card.series || '',
                        element: card.element || '',
                        role: card.role || '',
                        image_url: card.image_url || '',
                        is_iconic: card.is_iconic || false,
                        id: card.id || allCards.length + 1
                    });
                }
            });
            
            console.log(`Added ${cards.length} cards from page ${page}`);
        } catch (error) {
            console.error(`Error fetching page ${page}:`, error.message);
        }
    }
    
    const outputPath = path.join(__dirname, '..', 'cards.json');
    fs.writeFileSync(outputPath, JSON.stringify(allCards, null, 4));
    console.log(`✅ Scraped ${allCards.length} cards and saved to cards.json`);
}

scrapeAllCards().catch(console.error);
