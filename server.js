const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

const app = express();
const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 3001);
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const configPath = path.join(__dirname, "build", "contracts.json");

// Hardhat's publicly documented local development keys. These are for local demos only.
// Never use these keys with real funds or expose this server to the public internet.
const DEV_KEYS = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1c3b3e1f4f5f5e1e3e2e4f6f7f8a9b0c1d2e3f4a5b6c7d8e9f0012"
];
// Derive the full account list from the running local node. Private keys for demo voters
// are intentionally kept server-side and never sent to the browser.
const HARDHAT_MNEMONIC = "test test test test test test test test test test test junk";
function localWallet(index, p) {
  return ethers.HDNodeWallet.fromPhrase(HARDHAT_MNEMONIC, undefined, `m/44'/60'/0'/0/${index}`).connect(p);
}

app.use(cors({ origin: ["http://127.0.0.1:5173", "http://localhost:5173"] }));
app.use(express.json());

function loadConfig() {
  if (!fs.existsSync(configPath)) throw new Error("Contract is not deployed yet. Start the project with npm run dev.");
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}
function provider() {
  return new ethers.JsonRpcProvider(RPC_URL, 31337, { staticNetwork: true });
}
function contractRead(p, cfg) {
  return new ethers.Contract(cfg.address, cfg.abi, p);
}
function signerFor(index, p) {
  return localWallet(index, p);
}
function errorMessage(err) {
  const raw = err?.shortMessage || err?.reason || err?.message || "Request failed";
  if (raw.includes("already voted")) return "This demo account has already voted.";
  if (raw.includes("not an eligible voter")) return "This account is not on the eligible voter list.";
  if (raw.includes("Election already started") || raw.includes("Eligibility is locked")) return "This action is locked after voting starts.";
  if (raw.includes("Only election admin")) return "Only the election administrator can perform this action.";
  if (raw.includes("Voting is not open")) return "Voting is currently closed.";
  return raw.replace(/^execution reverted:?\s*/i, "").slice(0, 240);
}
app.get("/api/health", async (_req, res) => {
  try {
    const p = provider();
    const network = await p.getNetwork();
    const blockNumber = await p.getBlockNumber();
    res.json({ ok: true, chainId: Number(network.chainId), blockNumber });
    p.destroy();
  } catch {
    res.status(503).json({ ok: false, message: "Local blockchain is not running." });
  }
});
app.get("/api/state", async (_req, res) => {
  let p;
  try {
    const cfg = loadConfig(); p = provider();
    const c = contractRead(p, cfg);
    const count = Number(await c.getCandidateCount());
    const candidates = [];
    for (let i = 0; i < count; i++) {
      const row = await c.getCandidate(i);
      candidates.push({ id: Number(row[0]), name: row[1], description: row[2], votes: Number(row[3]), active: row[4] });
    }
    const [open, finalized, title, blockNumber] = await Promise.all([
      c.votingOpen(), c.electionFinalized(), c.electionTitle(), p.getBlockNumber()
    ]);
    const voters = cfg.voters.map((address, i) => ({ id: i + 1, address, label: `Voter ${String(i + 1).padStart(2, "0")}` }));
    res.json({ title, candidates, open, finalized, blockNumber, chainId: cfg.chainId, admin: cfg.admin, contractAddress: cfg.address, voters });
  } catch (e) { res.status(500).json({ error: errorMessage(e) }); }
  finally { if (p) p.destroy(); }
});
app.get("/api/history", async (_req, res) => {
  let p;
  try {
    const cfg = loadConfig(); p = provider();
    const c = contractRead(p, cfg);
    const events = await c.queryFilter(c.filters.VoteCast(), 0, "latest");
    const history = await Promise.all(events.map(async (event) => {
      const block = await p.getBlock(event.blockNumber);
      return {
        voter: event.args.voter,
        candidateId: Number(event.args.candidateId),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: block ? Number(block.timestamp) * 1000 : null
      };
    }));
    history.sort((a, b) => b.blockNumber - a.blockNumber);
    res.json({ history });
  } catch (e) { res.status(500).json({ error: errorMessage(e) }); }
  finally { if (p) p.destroy(); }
});
app.post("/api/admin/candidate", async (req, res) => {
  let p;
  try {
    const { name, description = "" } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: "Enter a candidate name." });
    const cfg = loadConfig(); p = provider();
    const c = contractRead(p, cfg).connect(localWallet(0, p));
    const tx = await c.addCandidate(String(name).trim().slice(0, 70), String(description).trim().slice(0, 160));
    const receipt = await tx.wait();
    res.json({ ok: true, txHash: tx.hash, blockNumber: receipt.blockNumber });
  } catch (e) { res.status(400).json({ error: errorMessage(e) }); }
  finally { if (p) p.destroy(); }
});
app.post("/api/admin/start", async (_req, res) => {
  let p;
  try {
    const cfg = loadConfig(); p = provider();
    const c = contractRead(p, cfg).connect(localWallet(0, p));
    const tx = await c.startVoting(); const receipt = await tx.wait();
    res.json({ ok: true, txHash: tx.hash, blockNumber: receipt.blockNumber });
  } catch (e) { res.status(400).json({ error: errorMessage(e) }); }
  finally { if (p) p.destroy(); }
});
app.post("/api/admin/end", async (_req, res) => {
  let p;
  try {
    const cfg = loadConfig(); p = provider();
    const c = contractRead(p, cfg).connect(localWallet(0, p));
    const tx = await c.endVoting(); const receipt = await tx.wait();
    res.json({ ok: true, txHash: tx.hash, blockNumber: receipt.blockNumber });
  } catch (e) { res.status(400).json({ error: errorMessage(e) }); }
  finally { if (p) p.destroy(); }
});
app.post("/api/vote", async (req, res) => {
  let p;
  try {
    const voterIndex = Number(req.body?.voterIndex);
    const candidateId = Number(req.body?.candidateId);
    if (!Number.isInteger(voterIndex) || voterIndex < 1 || voterIndex > 6) return res.status(400).json({ error: "Choose one of the six demo voter accounts." });
    if (!Number.isInteger(candidateId) || candidateId < 0) return res.status(400).json({ error: "Choose a valid candidate." });
    const cfg = loadConfig(); p = provider();
    const voterAddress = cfg.voters[voterIndex - 1];
    const wallet = localWallet(voterIndex, p);
    if ((await wallet.getAddress()).toLowerCase() !== voterAddress.toLowerCase()) return res.status(400).json({ error: "Local demo account configuration mismatch. Restart the project." });
    const c = contractRead(p, cfg).connect(wallet);
    const tx = await c.castVote(candidateId); const receipt = await tx.wait();
    res.json({ ok: true, txHash: tx.hash, blockNumber: receipt.blockNumber });
  } catch (e) { res.status(400).json({ error: errorMessage(e) }); }
  finally { if (p) p.destroy(); }
});

app.listen(PORT, HOST, () => console.log(`VoteChain API running at http://${HOST}:${PORT}`));
