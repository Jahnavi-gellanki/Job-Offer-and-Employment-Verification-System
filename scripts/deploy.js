const hre = require("hardhat");
const fs  = require("fs");
const path = require("path");

async function main() {
  console.log("\n🚀  Deploying JobOfferVerification contract...\n");

  const [deployer] = await hre.ethers.getSigners();
  const balance    = await hre.ethers.provider.getBalance(deployer.address);

  console.log("📋  Deployer  :", deployer.address);
  console.log("💰  Balance   :", hre.ethers.formatEther(balance), "ETH");
  console.log("🌐  Network   :", hre.network.name, "\n");

  // Deploy
  const Factory  = await hre.ethers.getContractFactory("JobOfferVerification");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const deployTx        = contract.deploymentTransaction();

  console.log("✅  Contract Address :", contractAddress);
  console.log("📦  Tx Hash          :", deployTx.hash);

  // Persist deployment record
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });

  const record = {
    network:         hre.network.name,
    contractAddress,
    deployerAddress: deployer.address,
    deployedAt:      new Date().toISOString(),
    transactionHash: deployTx.hash
  };

  fs.writeFileSync(
    path.join(deploymentsDir, `${hre.network.name}.json`),
    JSON.stringify(record, null, 2)
  );
  console.log(`\n💾  Deployment info saved → deployments/${hre.network.name}.json`);

  // Patch server/.env automatically
  const serverEnvPath = path.join(__dirname, "../server/.env");
  if (fs.existsSync(serverEnvPath)) {
    let env = fs.readFileSync(serverEnvPath, "utf8");
    env = env.replace(/^CONTRACT_ADDRESS=.*/m, `CONTRACT_ADDRESS=${contractAddress}`);
    fs.writeFileSync(serverEnvPath, env);
    console.log("📝  Updated server/.env → CONTRACT_ADDRESS");
  }

  // Patch client/.env automatically
  const clientEnvPath = path.join(__dirname, "../client/.env");
  if (fs.existsSync(clientEnvPath)) {
    let env = fs.readFileSync(clientEnvPath, "utf8");
    env = env.replace(/^VITE_CONTRACT_ADDRESS=.*/m, `VITE_CONTRACT_ADDRESS=${contractAddress}`);
    fs.writeFileSync(clientEnvPath, env);
    console.log("📝  Updated client/.env  → VITE_CONTRACT_ADDRESS");
  }

  console.log("\n" + "─".repeat(54));
  console.log("🎉  Deployment complete!");
  console.log("─".repeat(54));
  console.log(`   Contract : ${contractAddress}`);
  console.log(`   Network  : ${hre.network.name}`);
  console.log("─".repeat(54) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("❌  Deployment failed:", err);
    process.exit(1);
  });
