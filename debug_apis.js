const axios = require('axios');

// Test function for NACHO price USD
async function testNachoPriceUSD() {
    console.log('=== Testing NACHO Price USD API ===');
    const apiUrl = 'https://api.pionex.com/api/v1/market/trades?symbol=NACHO_USDT&limit=10';
    try {
        const response = await axios.get(apiUrl);
        console.log('Response status:', response.status);
        console.log('Response data structure:', Object.keys(response.data));
        
        if (response.data.data && response.data.data.trades) {
            const trades = response.data.data.trades;
            console.log('Number of trades:', trades.length);
            
            if (trades.length > 0) {
                const latestTrade = trades.reduce((latest, trade) => {
                    return trade.timestamp > latest.timestamp ? trade : latest;
                });
                
                console.log('Latest trade:', latestTrade);
                const price = parseFloat(latestTrade.price).toFixed(7);
                console.log('Extracted price:', price);
                return price;
            }
        }
        console.log('No valid trades data found');
        return null;
    } catch (error) {
        console.error('Error testing NACHO price API:', error.message);
        return null;
    }
}

// Test function for NACHO 24h volume
async function testNacho24hVolume() {
    console.log('\n=== Testing NACHO 24h Volume API ===');
    const apiUrl = 'https://api.pionex.com/api/v1/market/tickers?symbol=NACHO_USDT';
    try {
        const response = await axios.get(apiUrl);
        console.log('Response status:', response.status);
        console.log('Response data structure:', Object.keys(response.data));
        
        if (response.data.data && response.data.data.tickers) {
            const tickers = response.data.data.tickers;
            console.log('Number of tickers:', tickers.length);
            
            if (tickers.length > 0) {
                console.log('First ticker:', tickers[0]);
                const volume = parseFloat(tickers[0].amount);
                const formattedVolume = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(volume);
                console.log('Raw volume:', volume);
                console.log('Formatted volume:', formattedVolume);
                return formattedVolume;
            }
        }
        console.log('No valid tickers data found');
        return null;
    } catch (error) {
        console.error('Error testing NACHO volume API:', error.message);
        return null;
    }
}

// Test function for market cap
async function testMarketCap() {
    console.log('\n=== Testing Market Cap API ===');
    const apiUrl = 'https://api.kaspa.org/info/price?stringOnly=false';
    try {
        const response = await axios.get(apiUrl);
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
        
        if (response.data && response.data.price) {
            console.log('KAS price found:', response.data.price);
            // We need floor price too for market cap calculation
            const floorPrice = await testFloorPrice();
            if (floorPrice !== null) {
                const marketCap = floorPrice * 287000000000 * response.data.price;
                const formattedMarketCap = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(marketCap);
                console.log('Calculated market cap:', formattedMarketCap);
                return formattedMarketCap;
            }
        }
        console.log('No valid market cap data found');
        return null;
    } catch (error) {
        console.error('Error testing market cap API:', error.message);
        return null;
    }
}

// Test function for floor price
async function testFloorPrice() {
    console.log('\n=== Testing NFT Floor Price API ===');
    const apiUrl = 'https://api.kaspa.com/krc721/NACHO';
    
    try {
        const response = await axios.get(apiUrl);
        console.log('Response status:', response.status);
        
        if (response.data && response.data.price) {
            console.log('NFT price found:', response.data.price);
            const floorPrice = response.data.price.toFixed(7);
            console.log('Formatted floor price:', floorPrice);
            return floorPrice;
        }
        console.log('No price data found in response');
        return null;
    } catch (error) {
        console.error('Error testing NFT floor price API:', error.message);
        return null;
    }
}

// Run all tests
async function runAllTests() {
    console.log('Starting API tests...\n');
    
    await testNachoPriceUSD();
    await testNacho24hVolume();
    await testMarketCap();
    
    console.log('\n=== All tests completed ===');
}

runAllTests().catch(console.error); 