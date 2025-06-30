require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

// Initialize Discord bot client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Your bot token (use environment variable for security)
const token = process.env.DISCORD_BOT_TOKEN;

// The channel ID where the floor price updates will be reflected in the name
const channelId = '1285774928645324831'; // Replace with your actual channel ID

// The channel ID where the market cap updates will be reflected in the name
const marketCapChannelId = '1286908343482585169'; // Channel ID for market cap updates

// The channel ID where the NACHO price in USD will be reflected in the name
const nachoPriceChannelId = '1295846999459106857'; // Replace with your actual channel ID

// Function to get the current timestamp (seconds since Epoch)
const getTimestamp = () => {
    return Math.floor(Date.now() / 1000);
};

// Function to fetch NACHO floor price from the API with retries
async function getFloorPrice(retries = 3) {
    const apiUrl = 'https://api.kaspa.com/krc721/NACHO';

    console.log('Fetching NFT floor price from API...'); // Log when fetching starts

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const response = await axios.get(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                timeout: 10000 // 10 second timeout
            });
            
            const data = response.data;

            // Extract the price field from the response and convert to whole number
            const price = data.price ? Math.floor(data.price) : null; // Convert to whole number

            console.log(`Fetched NFT floor price: ${price} KAS`); // Log the fetched price
            return price;
        } catch (error) {
            console.error(`Error fetching NACHO NFT floor price (attempt ${attempt + 1}):`, error.message); // Log specific error message
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response headers:', error.response.headers);
            }
            if (attempt < retries - 1) {
                console.log(`Retrying... (${attempt + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
            }
        }
    }

    return null; // Return null if all attempts fail
}

// Function to fetch Nacho market cap from the API
async function getMarketCap() {
    try {
        // Get NACHO token price in USD from Pionex API
        const nachoPriceUSD = await getNachoPriceUSD();
        
        if (nachoPriceUSD !== null) {
            const totalSupply = 287000000000; // 287 billion tokens
            const marketCap = parseFloat(nachoPriceUSD) * totalSupply;
            const formattedMarketCap = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(marketCap);
            console.log(`Calculated market cap: $${nachoPriceUSD} × ${totalSupply.toLocaleString()} = ${formattedMarketCap}`);
            return formattedMarketCap;
        } else {
            console.error('Failed to fetch NACHO token price.');
            return null;
        }
    } catch (error) {
        console.error('Error calculating market cap:', error);
        return null;
    }
}

// Function to fetch the latest NACHO price in USD from the Pionex API
async function getNachoPriceUSD() {
    const apiUrl = 'https://api.pionex.com/api/v1/market/trades?symbol=NACHO_USDT&limit=10';
    try {
        const response = await axios.get(apiUrl);
        const trades = response.data.data.trades;

        if (trades && trades.length > 0) {
            const latestTrade = trades.reduce((latest, trade) => {
                return trade.timestamp > latest.timestamp ? trade : latest;
            });

            const price = parseFloat(latestTrade.price).toFixed(7);
            console.log(`Fetched NACHO price: ${price} USD`);
            return price;
        } else {
            console.error('No trades data found in the Pionex response');
            return null;
        }
    } catch (error) {
        console.error('Error fetching NACHO price from Pionex API:', error.message);
        return null;
    }
}

// Function to update all channel names
async function updateAllChannels() {
    console.log('Attempting to update all channel names...');

    // Update floor price channel
    const floorPrice = await getFloorPrice();
    if (floorPrice !== null) {
        const floorChannel = await client.channels.fetch(channelId);
        const newFloorChannelName = `NFT Floor: ${floorPrice} KAS`;
        try {
            await floorChannel.setName(newFloorChannelName);
            console.log(`Floor price channel name updated to: ${newFloorChannelName}`);
        } catch (error) {
            console.error('Error updating floor price channel name:', error.message);
        }
    } else {
        console.log('No floor price available to update the channel name.');
    }

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update market cap channel
    console.log('Starting market cap update...');
    const marketCap = await getMarketCap();
    console.log('Market cap result:', marketCap);
    if (marketCap !== null) {
        console.log('Fetching market cap channel...');
        const marketCapChannel = await client.channels.fetch(marketCapChannelId);
        console.log('Market cap channel fetched:', marketCapChannel ? 'Success' : 'Failed');
        const newMarketCapChannelName = `MC: ${marketCap} USD`;
        console.log('Attempting to update channel name to:', newMarketCapChannelName);
        try {
            await marketCapChannel.setName(newMarketCapChannelName);
            console.log(`Market cap channel name updated to: ${newMarketCapChannelName}`);
        } catch (error) {
            console.error('Error updating market cap channel name:', error.message);
            console.error('Full error:', error);
            if (error.code) {
                console.error('Discord error code:', error.code);
            }
        }
    } else {
        console.log('No market cap available to update the channel name.');
    }

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update NACHO price channel
    const nachoPrice = await getNachoPriceUSD();
    if (nachoPrice !== null) {
        const nachoPriceChannel = await client.channels.fetch(nachoPriceChannelId);
        const newNachoPriceChannelName = `Price: ${nachoPrice} USD`;
        try {
            await nachoPriceChannel.setName(newNachoPriceChannelName);
            console.log(`NACHO price channel name updated to: ${newNachoPriceChannelName}`);
        } catch (error) {
            console.error('Error updating NACHO price channel name:', error.message);
        }
    } else {
        console.log('No NACHO price available to update the channel name.');
    }
}

// Set an interval to update all channel names every 15 minutes
client.once('ready', () => {
    console.log('Bot is ready!');

    // Update all channels immediately, then every 15 minutes
    updateAllChannels();
    setInterval(updateAllChannels, 900000); // 15 minutes
});

// Log in to Discord with the bot's token
client.login(token)
    .then(() => console.log('Bot logged in successfully.'))
    .catch(error => console.error('Failed to log in:', error.message)); // Log any login errors

