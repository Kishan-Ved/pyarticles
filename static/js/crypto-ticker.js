// author: Kishan Ved

const COINS = [
    { symbol: "BTC", name: "Bitcoin", logo: "/static/assets/img/logos/bitcoin-btc-logo.png", stream: "btcusdt" },
    { symbol: "ETH", name: "Ethereum", logo: "/static/assets/img/logos/ethereum-eth-logo.png", stream: "ethusdt" },
    { symbol: "ADA", name: "Cardano", logo: "/static/assets/img/logos/cardano-ada-logo.png", stream: "adausdt" },
    { symbol: "BNB", name: "BNB", logo: "/static/assets/img/logos/bnb-bnb-logo.png", stream: "bnbusdt" },
    { symbol: "SOL", name: "Solana", logo: "/static/assets/img/logos/solana-sol-logo.png", stream: "solusdt" }
];

let tickerTrack;

// One ticker loop
function generateTickerHTML() {
    return COINS.map(coin => `
    <a data-symbol="${coin.symbol}" 
        href="#" 
        title="View price details"
        class="hover:bg-neutral-100 transition-colors flex h-full flex-shrink-0 cursor-pointer text-xs"
        style="min-width: 180px;">
        <div class="flex h-full items-center whitespace-nowrap px-4 text-neutral-600 font-sans leading-none">
            <img 
            alt="${coin.symbol} logo" 
            loading="lazy" 
            width="16" height="16" 
            decoding="async" 
            class="rounded-full w-4 h-4 mr-1 flex-shrink-0" 
            src="${coin.logo}"
            style="color:transparent"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';"
            >
            <div class="w-4 h-4 mr-1 flex-shrink-0 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-600" style="display:none;">${coin.symbol.charAt(0)}</div>
            <div class="flex items-center space-x-2 leading-none">
            <span class="font-medium align-middle">${coin.symbol}</span>
            <span class="price font-mono align-middle">$0.00</span>
            <span class="change font-mono font-normal align-middle text-chart-negative"><span class="triangle">▼</span>0.00%</span>
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
    const viewportWidth = window.innerWidth;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = singleLoop;
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.display = 'flex';
    tempDiv.style.width = 'max-content';
    document.body.appendChild(tempDiv);
    
    const singleLoopWidth = tempDiv.scrollWidth;
    document.body.removeChild(tempDiv);
    
    // Calculate how many loops we need to fill at least 3x the viewport width
    const minRequiredWidth = viewportWidth * 3;
    const loopsNeeded = Math.ceil(minRequiredWidth / singleLoopWidth);
    const totalLoops = Math.max(3, loopsNeeded); // 3 min
    
    tickerTrack.innerHTML = singleLoop.repeat(totalLoops);
    
    // Set the scroll distance based on the number of loops
    const scrollPercentage = -(100 / totalLoops);
    tickerTrack.style.setProperty('--scroll-distance', `${scrollPercentage}%`);
    tickerTrack.style.width = 'max-content';
    adjustAnimationSpeed(totalLoops);
}

// Adjust animation speed based on content width
function adjustAnimationSpeed(totalLoops = 2) {
    // Add loading class to pause animation initially
    tickerTrack.classList.add('loading');
    
    // Wait for DOM to update
    setTimeout(() => {
        const tickerFullWidth = tickerTrack.scrollWidth;
        const singleLoopWidth = tickerFullWidth / totalLoops;
        const viewportWidth = window.innerWidth;
        
        // Calculate duration: consistent speed across all devices
        // Base speed: 80px per second (slightly slower for better readability)
        const baseSpeed = 80;
        const duration = Math.max(15, singleLoopWidth / baseSpeed); // Minimum 15 seconds
        
        tickerTrack.style.animationDuration = `${duration}s`;
        console.log(`Single loop width: ${singleLoopWidth}px, Total loops: ${totalLoops}, Viewport: ${viewportWidth}px, Duration: ${duration}s`);
        
        // Remove loading class to start the animation
        setTimeout(() => {
            tickerTrack.classList.remove('loading');
        }, 100);
    }, 200);
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
                const triangle = priceChangePercent >= 0 ? '▲' : '▼';
                changeEl.innerHTML = `<span class="triangle">${triangle}</span>${parseFloat(priceChangePercent).toFixed(2)}%`;
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

// Handle window resize for mobile orientation changes
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        console.log("Window resized, recalculating ticker");
        fillTicker(); // Recalculate everything on resize
    }, 250);
});
