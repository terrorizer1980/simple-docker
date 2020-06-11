const client = require("@connext/client");
const connextUtils = require("@connext/utils");
const ethers = require("ethers");

const { connect } = client;
const { getRandomChannelSigner, ColorfulLogger } = connextUtils;
const { JsonRpcProvider } = ethers.providers;
const { parseEther } = ethers.utils;

// Define defaults (for locally running node/chain)
const defaultFunder =
  "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";
const defaultNodeUrl = "http://localhost:8080";
const defaultEthUrl = "http://localhost:8545";

const runExample = async (nodeUrl, ethUrl, funderMnemonic) => {
  // Get random signer
  const provider = new JsonRpcProvider(ethUrl);
  const signer = getRandomChannelSigner(ethUrl);

  const loggerService = new ColorfulLogger("SimpleDockerClient", 3, true, ":)");
  const testLog = loggerService.newContext("Test");

  // Create client
  const channel = await connect({
    nodeUrl,
    ethProviderUrl: ethUrl,
    signer,
    loggerService,
  });

  // Fund signer so they can deposit into channel
  const value = parseEther("0.1");
  testLog.info(`Sending ${value.toString()} ETH to ${signer.address}`);
  const funder = ethers.Wallet.fromMnemonic(funderMnemonic).connect(provider);
  const tx = await funder.sendTransaction({
    to: signer.address,
    value,
  });
  await tx.wait();
  const bal = await provider.getBalance(signer.address);
  testLog.info(`Sent, new balance: ${bal.toString()}`);

  // Deposit ETH into channel
  try {
    await channel.deposit({
      amount: parseEther("0.01"),
    });
  } catch (e) {
    testLog.error(`Error sending deposit to channel: ${e.message}`);
  }
  testLog.info(`Example complete!`);
  process.exit(0);
};

(async () => {
  await runExample(
    process.env.NODE_URL || defaultNodeUrl,
    process.env.ETH_URL || defaultEthUrl,
    process.env.FUNDER || defaultFunder
  );
})();
