const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

let webhookUrl = null;
let commandCount = 0;
let messageId = null;
const statusFile = path.join(__dirname, '..', 'bot-status.json');

function initializeStatus() {
  if (!fs.existsSync(statusFile)) {
    fs.writeFileSync(statusFile, JSON.stringify({
      activatedDate: new Date().toISOString(),
      restartedDate: new Date().toISOString()
    }, null, 2));
  }
}

function getUptimeString(startDate) {
  const now = new Date();
  const start = new Date(startDate);
  const diff = now - start;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${days}d ${hours}h ${minutes}m`;
}

async function getRailwayMetrics() {
  if (!process.env.RAILWAY_API_TOKEN) return null;
  
  try {
    const query = `
      query {
        deployments(first: 1, projectId: "${process.env.RAILWAY_PROJECT_ID}") {
          edges {
            node {
              id
              status
              createdAt
            }
          }
        }
      }
    `;
    
    const response = await fetch('https://api.railway.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RAILWAY_API_TOKEN}`
      },
      body: JSON.stringify({ query })
    });
    
    const data = await response.json();
    return data.data?.deployments?.edges?.[0]?.node || null;
  } catch (error) {
    console.error('Failed to fetch Railway metrics:', error);
    return null;
  }
}

async function createStatusEmbed() {
  initializeStatus();
  const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
  const activatedDate = new Date(status.activatedDate);
  const restartedDate = new Date(status.restartedDate);
  const uptime = getUptimeString(status.restartedDate);
  
  const shutdownDate = new Date(restartedDate);
  shutdownDate.setDate(shutdownDate.getDate() + 30);
  const daysUntilShutdown = Math.ceil((shutdownDate - new Date()) / (1000 * 60 * 60 * 24));
  
  const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  const memMax = (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2);
  
  const railwayMetrics = await getRailwayMetrics();
  
  const embed = new EmbedBuilder()
    .setTitle('🤖 Bot Status Monitor')
    .setColor(0x00ff00)
    .addFields(
      { name: 'Status', value: '🟢 Online', inline: true },
      { name: 'Uptime', value: uptime, inline: true },
      { name: 'Memory', value: `${memUsage} MB / ${memMax} MB`, inline: true },
      { name: 'Activated', value: activatedDate.toLocaleString(), inline: false },
      { name: 'Last Restarted', value: restartedDate.toLocaleString(), inline: false },
      { name: 'Shutdown In', value: `${daysUntilShutdown} days`, inline: true },
      { name: 'Commands Used', value: commandCount.toString(), inline: true },
      { name: 'Deployment', value: railwayMetrics?.status || 'Unknown', inline: true },
      { name: 'Database', value: '✅ Connected', inline: true }
    )
    .setFooter({ text: `Status Monitor | Last Updated: ${new Date().toLocaleString()}` });
  
  return embed;
}

async function postOrEditEmbed() {
  if (!webhookUrl) return;
  
  try {
    const embed = await createStatusEmbed();
    
    if (!messageId) {
      // First post
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed.toJSON()] })
      });
      const data = await response.json();
      messageId = data.id;
    } else {
      // Edit existing message
      const webhookParts = webhookUrl.split('/');
      const webhookId = webhookParts[webhookParts.length - 2];
      const webhookToken = webhookParts[webhookParts.length - 1];
      
      await fetch(`https://discord.com/api/webhooks/${webhookId}/${webhookToken}/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed.toJSON()] })
      });
    }
  } catch (error) {
    console.error('Failed to post/edit health webhook:', error);
  }
}

module.exports = {
  setWebhookUrl: (url) => {
    webhookUrl = url;
  },

  incrementCommandCount: () => {
    commandCount++;
  },

  startHealthPosting: () => {
    postOrEditEmbed();
    setInterval(postOrEditEmbed, 3600000);
  },

  getCommandCount: () => commandCount
};
