const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Get environment variables from GitHub Actions
const timestamp = process.env.DEPLOYMENT_TIMESTAMP || new Date().toISOString();
const service = process.env.DEPLOYMENT_SERVICE || 'Smart-Credential-main';
const status = process.env.DEPLOYMENT_STATUS || 'success';
const environment = process.env.DEPLOYMENT_ENVIRONMENT || 'production';
const commitSha = process.env.DEPLOYMENT_COMMIT_SHA || '';
const deployedBy = process.env.DEPLOYMENT_DEPLOYED_BY || 'webhook';

// Read existing ledger
const ledgerPath = path.join(__dirname, '../ledger.json');
let ledger = [];

try {
  if (fs.existsSync(ledgerPath)) {
    const data = fs.readFileSync(ledgerPath, 'utf-8');
    ledger = JSON.parse(data);
  }
} catch (error) {
  console.error('Error reading ledger:', error.message);
  ledger = [];
}

// Calculate previous hash
let previousHash = '0';
if (ledger.length > 0) {
  previousHash = ledger[ledger.length - 1].current_hash;
}

// Create new entry
const newEntry = {
  block_id: ledger.length + 1,
  timestamp,
  service,
  status,
  environment,
  commit_sha: commitSha,
  deployed_by: deployedBy,
  previous_hash: previousHash,
};

// Calculate current hash (SHA256 of entry data excluding current_hash)
const entryString = JSON.stringify(newEntry);
const currentHash = crypto.createHash('sha256').update(entryString).digest('hex');
newEntry.current_hash = currentHash;

// Add to ledger
ledger.push(newEntry);

// Write back to file
try {
  fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));
  console.log(`✅ Ledger updated! Block ID: ${newEntry.block_id}`);
  console.log(`   Timestamp: ${timestamp}`);
  console.log(`   Service: ${service}`);
  console.log(`   Status: ${status}`);
  console.log(`   Hash: ${currentHash.substring(0, 16)}...`);
} catch (error) {
  console.error('❌ Error writing ledger:', error.message);
  process.exit(1);
}
