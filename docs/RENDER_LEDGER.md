# Render Deployment Ledger Integration

This setup automatically records all Render deployments to `ledger.json` with blockchain-style hashing for audit trails.

## How It Works

### Option 1: Manual Trigger via GitHub Actions

1. Go to **Actions** → **Update Ledger on Render Deployment**
2. Click **Run workflow**
3. Fill in the deployment details:
   - **timestamp**: ISO format (e.g., `2026-05-11T10:30:00Z`)
   - **service**: Your app name
   - **status**: `success` or `failed`
   - **environment**: `production` or `staging`
   - **commit_sha**: (optional) Git commit SHA

### Option 2: Render Webhook Integration (Recommended)

To automatically trigger on every Render deployment:

1. **Get your GitHub Personal Access Token (PAT)**
   - Go to Settings → Developer settings → Personal access tokens
   - Create a new token with `repo` and `workflow` permissions
   - Copy the token

2. **Configure Render Webhook**
   - In Render Dashboard, go to your service
   - Settings → Notifications → Add Webhook
   - **Webhook URL**: 
     ```
     https://api.github.com/repos/sujandeeep/Smart-Credential-main/actions/workflows/update-ledger.yml/dispatches
     ```
   - **Headers** (JSON):
     ```json
     {
       "Authorization": "token YOUR_PAT_HERE",
       "Accept": "application/vnd.github.v3+json"
     }
     ```
   - **Body** (JSON):
     ```json
     {
       "ref": "main",
       "inputs": {
         "timestamp": "${{ now }}",
         "service": "${{ service.name }}",
         "status": "${{ deploy.status }}",
         "environment": "production",
         "commit_sha": "${{ commit.sha }}"
       }
     }
     ```

3. Test the webhook by triggering a deployment on Render

## Ledger Entry Schema

Each entry in `ledger.json` contains:
- **block_id**: Unique sequential ID
- **timestamp**: ISO 8601 deployment time
- **service**: Application/service name
- **status**: `success` or `failed`
- **environment**: Deployment environment
- **commit_sha**: Git commit that was deployed
- **deployed_by**: Who triggered the deployment
- **previous_hash**: SHA256 of previous block (immutable chain)
- **current_hash**: SHA256 of current block

## Example Ledger Entry

```json
{
  "block_id": 3,
  "timestamp": "2026-05-11T10:30:00.000Z",
  "service": "Smart-Credential-main",
  "status": "success",
  "environment": "production",
  "commit_sha": "abc123def456",
  "deployed_by": "render-webhook",
  "previous_hash": "345127b88cc1a566f908b8af5b42a5606071b911d9c96637ab9153e7d911dac0",
  "current_hash": "789xyz..."
}
```

## Verification

The hash chain ensures immutability - if any historical entry is modified, all subsequent hashes will be invalid. This creates an audit trail of all deployments.
