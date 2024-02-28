const { ethers } = require("ethers");
const { ChainId, Token, TokenAmount, Pair, Route, Trade, TradeType, WETH, Fetcher, Percent } = require('@uniswap/sdk');

async function main() {
    // 1. Set up your environment with ethers.js
    const provider = new ethers.providers.JsonRpcProvider("YOUR_RPC_ENDPOINT");
    const wallet = new ethers.Wallet("YOUR_PRIVATE_KEY", provider);

    // 2. Connect to an Ethereum provider (Uniswap uses mainnet)
    const chainId = ChainId.MAINNET;

    // 3. Use ethers.js to interact with Uniswap's smart contract
    // Example: Swapping ETH for DAI
    const DAI = new Token(chainId, "0x6B175474E89094C44Da98b954EedeAC495271d0F", 18);
    const pair = await Fetcher.fetchPairData(WETH[chainId], DAI);

    const route = new Route([pair], WETH[chainId]);
    const trade = new Trade(route, new TokenAmount(WETH[chainId], '1000000000000000000'), TradeType.EXACT_INPUT);

    console.log("Execution Price:", trade.executionPrice.toSignificant(6));
    console.log("Next Mid Price:", trade.nextMidPrice.toSignificant(6));

    const slippageTolerance = new Percent("50", "10000"); // 0.50% slippage tolerance
    const amountOutMin = trade.minimumAmountOut(slippageTolerance);

    // Set up Uniswap contract
    const uniswap = new ethers.Contract(
        "UNISWAP_ROUTER_ADDRESS", // Address of Uniswap router contract
        [
            "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
        ],
        wallet
    );

    // Execute swap
    const tx = await uniswap.swapExactETHForTokens(
        amountOutMin.raw.toString(),
        [WETH[chainId].address, DAI.address],
        wallet.address,
        Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from now
        { value: ethers.utils.parseEther("1"), gasPrice: ethers.utils.parseUnits("50", "gwei") } // Example: sending 1 ETH
    );

    console.log("Transaction Hash:", tx.hash);
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});
