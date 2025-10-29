const COINS = [
    { symbol: "BTC", name: "Bitcoin", logo: "https://cryptologos.cc/logos/bitcoin-btc-logo.png", stream: "btcusdt" },
    { symbol: "ETH", name: "Ethereum", logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png", stream: "ethusdt" },
    { symbol: "ADA", name: "Cardano", logo: "https://cryptologos.cc/logos/cardano-ada-logo.png", stream: "adausdt" },
    { symbol: "BNB", name: "BNB", logo: "https://cryptologos.cc/logos/bnb-bnb-logo.png", stream: "bnbusdt" },
    { symbol: "SOL", name: "Solana", logo: "https://cryptologos.cc/logos/solana-sol-logo.png", stream: "solusdt" }
];

let tickerTrack;

// One ticker loop
function generateTickerHTML() {
    return COINS.map(coin => `
    <a data-symbol="${coin.symbol}" 
        href="#" 
        title="View price details"
        class="hover:bg-neutral-100 transition-colors flex h-full flex-shrink-0 cursor-pointer text-xs">
        <div class="flex h-full min-w-0 items-center whitespace-nowrap px-4 text-neutral-600 font-sans leading-none">
            <img 
            alt="${coin.symbol} logo" 
            loading="lazy" 
            width="16" height="16" 
            decoding="async" 
            class="rounded-full w-4 h-4 mr-1 flex-shrink-0" 
            src="${coin.logo}"
            style="color:transparent"
            >
            <div class="flex items-center space-x-2 leading-none">
            <span class="font-medium align-middle">${coin.symbol}</span>
            <span class="price font-mono align-middle">$0.00</span>
            <span class="change font-mono font-normal align-middle text-chart-negative">0.00%</span>
            </div>
        </div>
    </a>
    `).join("");
}

// Duplicate the ticker until it fills at least twice the screen width
function fillTicker() {
    if (!tickerTrack) {
        console.error("ticker-track element not found");
        return;
    }
    tickerTrack.innerHTML = "";
    const singleLoop = generateTickerHTML();

    // Add enough loops to ensure smooth infinite scrolling
    const repeatCount = 4; // more = safer coverage
    tickerTrack.innerHTML = singleLoop.repeat(repeatCount);
}

// Connect to Binance WebSocket
function connectBinance() {
    const streams = COINS.map(c => `${c.stream}@ticker`).join('/');
    const socket = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

    socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (!msg.data) return;

        const { s: symbol, c: lastPrice, P: priceChangePercent } = msg.data;
        const coin = COINS.find(c => c.stream.toUpperCase() === symbol);
        if (!coin) return;

        // Update all duplicate ticker items
        document.querySelectorAll(`[data-symbol="${coin.symbol}"]`).forEach(el => {
            const priceEl = el.querySelector('.price');
            const changeEl = el.querySelector('.change');
            if (priceEl && changeEl) {
                priceEl.textContent = `$${parseFloat(lastPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                changeEl.textContent = `${parseFloat(priceChangePercent).toFixed(2)}%`;
                changeEl.classList.toggle('text-green-500', priceChangePercent > 0);
                changeEl.classList.toggle('text-red-500', priceChangePercent < 0);
            }
        });
    };

    socket.onclose = () => {
        console.warn("Reconnecting to Binance...");
        setTimeout(connectBinance, 4000);
    };

    socket.onerror = err => {
        console.error("WebSocket error:", err);
        socket.close();
    };
}

console.log("Crypto ticker script loaded");
tickerTrack = document.getElementById("ticker-track");
console.log("ticker-track element:", tickerTrack);
fillTicker();
connectBinance();
