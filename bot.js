const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

// Initialize Discord bot client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Your bot token (replace with your actual token)
const token = process.env.DISCORD_BOT_TOKEN;

// The channel ID where the floor price updates will be reflected in the name
const channelId = '1285605233699061863'; // Replace with your actual channel ID

// Function to get the current timestamp (seconds since Epoch)
const getTimestamp = () => {
    return Math.floor(Date.now() / 1000);
};

// Function to fetch Kasper floor price from the API
async function getFloorPrice() {
    const timestamp = getTimestamp();
    const apiUrl = `https://storage.googleapis.com/kspr-api-v1/marketplace/marketplace.json?t=${timestamp}`;

    try {
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Extract the KASPER floor price from the data
        const kasperData = data.KASPER;
        const floorPrice = kasperData ? kasperData.floor_price : null;

        return floorPrice;
    } catch (error) {
        console.error('Error fetching Kasper floor price:', error);
        return null;
    }
}

// Function to update the channel name with the KASPER floor price
async function updateChannelName() {
    const floorPrice = await getFloorPrice();

    if (floorPrice !== null) {
        const channel = await client.channels.fetch(channelId);
        const newChannelName = `KASPER Floor: ${floorPrice} KAS`;

        // Set the new channel name
        channel.setName(newChannelName)
            .then(updated => console.log(`Channel name updated to: ${updated.name}`))
            .catch(error => console.error('Error updating channel name:', error));
    }
}

// Set an interval to update the channel name every 15 minutes (900000 ms)
client.once('ready', () => {
    console.log('Bot is ready!');

    // Update the channel name immediately, then every 15 minutes
    updateChannelName();
    setInterval(updateChannelName, 900000); // 15 minutes
});

// Log in to Discord with the bot's token
client.login(token);
