# VoteChain

A beginner-friendly blockchain mini project that demonstrates a class election using a Solidity smart contract and a local Ethereum-compatible development network.

## What is included?

- Election overview dashboard
- Candidate management
- Demo voter selector using local development accounts
- Solidity-enforced eligibility and one-vote-per-address rules
- Voting page with a confirmation step
- Results page with vote counts and percentages
- Transaction history with transaction hashes, block numbers and timestamps
- Local network status and contract details
- Automated smart-contract tests
- No real cryptocurrency, public testnet, wallet extension, or account registration required

## Requirements

- Node.js 20 LTS or newer
- npm
- VS Code (recommended)

## Run locally

1. Extract the ZIP and open the `VoteChain` folder in VS Code.
2. Open a terminal in that folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the full local development environment:

   ```bash
   npm run dev
   ```

5. Wait for the terminal to show that the local network, contract deployment, API and Vite server have started.
6. Open **http://127.0.0.1:5173** in your browser.

The `dev` command starts four processes: the local Hardhat blockchain, contract deployment, the local API server and the React website. The deployment script adds three sample candidates and six eligible demo voter accounts.

Stop the environment with `Ctrl+C`. Since this uses a local development chain, restarting it resets the chain and its records.

## How to demonstrate it

1. Open the **Candidates** page. The initial three sample candidates are already present.
2. Open **Cast a vote**.
3. Select `Voter 01` and choose a candidate.
4. Review and confirm the vote.
5. Open **Results** to see the updated count.
6. Open **Transactions** to see the confirmed transaction, block number, voter address and timestamp.
7. Select another voter account and cast another vote.
8. Try voting again with the first account. The smart contract should reject the duplicate.
9. To test candidate management, add a candidate before starting the election.
10. To start and end voting, use the administrator controls described below.

### Starting and ending the election

The administrator actions are intentionally kept simple. Use the API from a second terminal while the project is running:

```bash
# Start voting
curl -X POST http://127.0.0.1:3001/api/admin/start

# End voting
curl -X POST http://127.0.0.1:3001/api/admin/end
```

The admin account is the first local Hardhat account. These commands submit actual contract transactions to the local chain. After starting voting, candidate management is locked. Ending voting finalizes the election.

## Run contract tests

```bash
npm test
```

The tests cover candidate setup, minimum candidate count, valid voting, duplicate-vote prevention, ineligible accounts and closed elections.

## Project structure

```text
VoteChain/
├── contracts/       Solidity smart contract
├── scripts/         Local deployment script
├── test/            Smart-contract tests
├── src/             React pages and styles
├── public/          Favicon and static assets
├── server.js        Local-only API and transaction signer
├── index.html       Frontend entry HTML
├── hardhat.config.js
└── package.json
```

## Important educational and security notes

- This is an educational prototype, not a secure real-world election system.
- The local Hardhat network uses publicly known development accounts and keys. Never use these keys with real funds.
- The local API signs transactions for demo accounts. It is bound to `127.0.0.1` and must not be exposed publicly.
- The demo voter selector is not identity verification. Anyone with access to this local application can select a demo account.
- Blockchain transactions and account addresses are visible. The contract does not provide secret ballots.
- The local chain is reset when its node is restarted. It is not a permanent public blockchain.
- No public network, real cryptocurrency, or MetaMask is required.

## Hosting

The frontend is designed to run locally with the local API and blockchain. A hosted frontend alone cannot access a visitor's local blockchain. Do not deploy this local API or its development signing keys to a public host. Public deployment requires a separately designed secure transaction flow and an accessible blockchain network.

## Technologies

React, Vite, CSS, Express, ethers.js, Solidity, Hardhat and Lucide icons.
