# Integration Guide - azsize CLI

Learn how to integrate `azsize` into your DevOps workflows, CI/CD pipelines, and automation scripts.

---

## Table of Contents

- [Installation in CI/CD](#installation-in-cicd)
- [GitHub Actions](#github-actions)
- [Azure DevOps Pipelines](#azure-devops-pipelines)
- [Terraform Integration](#terraform-integration)
- [Bash/Shell Scripts](#bashshell-scripts)
- [PowerShell Scripts](#powershell-scripts)
- [Node.js/JavaScript](#nodejsjavascript)
- [Python Integration](#python-integration)
- [Docker](#docker)
- [Best Practices](#best-practices)

---

## Installation in CI/CD

### Quick Install
```bash
npm install -g azsize
```

### Verify Installation
```bash
azsize --version
```

---

## GitHub Actions

### Example: Check VM Before Terraform Deploy

```yaml
name: Deploy Infrastructure

on:
  push:
    branches: [main]

jobs:
  check-vm-availability:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install azsize
        run: npm install -g azsize

      - name: Check VM availability
        id: vm-check
        run: |
          # Check if VM is available in target region
          AVAILABLE=$(azsize check Standard_D4s_v5 --region eastus --json | jq -r '.vm.available')
          echo "available=$AVAILABLE" >> $GITHUB_OUTPUT

          if [ "$AVAILABLE" != "true" ]; then
            echo "❌ VM not available in eastus, checking alternatives..."
            azsize find Standard_D4s_v5 --limit 3
            exit 1
          fi

          echo "✅ VM available in eastus"

      - name: Deploy with Terraform
        if: steps.vm-check.outputs.available == 'true'
        run: terraform apply -auto-approve
```

### Example: Find Best Region for Deployment

```yaml
name: Find Cheapest Region

on: workflow_dispatch

jobs:
  find-region:
    runs-on: ubuntu-latest

    steps:
      - name: Install azsize
        run: npm install -g azsize

      - name: Find cheapest region
        run: |
          # Find all regions where VM is available, sorted by price
          CHEAPEST=$(azsize find Standard_E8s_v5 --json --limit 1 | jq -r '.regions[0].region')
          echo "Deploying to cheapest region: $CHEAPEST"
          echo "AZURE_REGION=$CHEAPEST" >> $GITHUB_ENV

      - name: Deploy to cheapest region
        run: |
          echo "Deploying to ${{ env.AZURE_REGION }}"
          # Your deployment commands here
```

---

## Azure DevOps Pipelines

### Example: Azure Pipeline with VM Check

```yaml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
  displayName: 'Install Node.js'

- script: |
    npm install -g azsize
  displayName: 'Install azsize CLI'

- script: |
    # Check VM availability
    azsize check Standard_D4s_v5 --region $(AZURE_REGION)

    # Get availability as JSON
    AVAILABLE=$(azsize check Standard_D4s_v5 --region $(AZURE_REGION) --json | jq -r '.vm.available')

    if [ "$AVAILABLE" != "true" ]; then
      echo "##vso[task.logissue type=error]VM not available in $(AZURE_REGION)"
      echo "Finding alternatives..."
      azsize find Standard_D4s_v5 --limit 5
      exit 1
    fi

    echo "##vso[task.setvariable variable=VM_AVAILABLE]true"
  displayName: 'Check VM Availability'

- script: |
    terraform apply -auto-approve
  displayName: 'Deploy Infrastructure'
  condition: eq(variables['VM_AVAILABLE'], 'true')
```

---

## Terraform Integration

### Pre-Deployment Check Script

Create a script `check-vm-availability.sh`:

```bash
#!/bin/bash

VM_SIZE="$1"
REGION="$2"

echo "Checking if $VM_SIZE is available in $REGION..."

# Install azsize if not already installed
if ! command -v azsize &> /dev/null; then
    npm install -g azsize
fi

# Check availability
RESULT=$(azsize check "$VM_SIZE" --region "$REGION" --json)
AVAILABLE=$(echo "$RESULT" | jq -r '.vm.available')

if [ "$AVAILABLE" != "true" ]; then
    echo "❌ ERROR: $VM_SIZE is not available in $REGION"
    echo ""
    echo "Finding alternative regions..."
    azsize find "$VM_SIZE" --limit 5
    exit 1
fi

echo "✅ $VM_SIZE is available in $REGION"
PRICE=$(echo "$RESULT" | jq -r '.vm.pricePerMonth')
echo "   Price: \$$PRICE/month"
exit 0
```

### Use in Terraform Workflow

```bash
#!/bin/bash

# Check VM before running terraform
./check-vm-availability.sh "Standard_D4s_v5" "eastus"

if [ $? -eq 0 ]; then
    terraform init
    terraform plan
    terraform apply
else
    echo "Aborting deployment - VM not available"
    exit 1
fi
```

---

## Bash/Shell Scripts

### Example: Automated Deployment Script

```bash
#!/bin/bash

set -e

VM_SIZE="Standard_D4s_v5"
PREFERRED_REGION="eastus"

echo "=== Azure VM Deployment Script ==="

# Function to check VM availability
check_vm() {
    local vm_size=$1
    local region=$2

    echo "Checking $vm_size in $region..."

    RESULT=$(azsize check "$vm_size" --region "$region" --json)
    AVAILABLE=$(echo "$RESULT" | jq -r '.vm.available')

    echo "$AVAILABLE"
}

# Check preferred region
AVAILABLE=$(check_vm "$VM_SIZE" "$PREFERRED_REGION")

if [ "$AVAILABLE" = "true" ]; then
    DEPLOY_REGION="$PREFERRED_REGION"
    echo "✅ Using preferred region: $DEPLOY_REGION"
else
    echo "⚠️  Preferred region unavailable, finding alternative..."

    # Find best alternative
    DEPLOY_REGION=$(azsize find "$VM_SIZE" --json --limit 1 | jq -r '.regions[0].region')

    if [ -z "$DEPLOY_REGION" ] || [ "$DEPLOY_REGION" = "null" ]; then
        echo "❌ VM not available in any region!"
        exit 1
    fi

    echo "✅ Using alternative region: $DEPLOY_REGION"
fi

# Deploy
echo "Deploying to $DEPLOY_REGION..."
az vm create \
    --resource-group myResourceGroup \
    --name myVM \
    --location "$DEPLOY_REGION" \
    --size "$VM_SIZE" \
    --image UbuntuLTS \
    --admin-username azureuser

echo "✅ Deployment complete!"
```

### Example: Monitoring Script

```bash
#!/bin/bash

# Monitor VM availability and alert if it becomes unavailable

VM_SIZE="Standard_D4s_v5"
REGION="eastus"
EMAIL="admin@example.com"

while true; do
    AVAILABLE=$(azsize check "$VM_SIZE" --region "$REGION" --json | jq -r '.vm.available')

    if [ "$AVAILABLE" != "true" ]; then
        echo "ALERT: $VM_SIZE no longer available in $REGION" | \
            mail -s "Azure VM Alert" "$EMAIL"
    fi

    sleep 3600  # Check every hour
done
```

---

## PowerShell Scripts

### Example: Windows PowerShell Script

```powershell
# check-azure-vm.ps1

param(
    [string]$VmSize = "Standard_D4s_v5",
    [string]$Region = "eastus"
)

Write-Host "Checking VM availability..." -ForegroundColor Cyan

# Check if azsize is installed
$azsizeInstalled = Get-Command azsize -ErrorAction SilentlyContinue

if (-not $azsizeInstalled) {
    Write-Host "Installing azsize..." -ForegroundColor Yellow
    npm install -g azsize
}

# Check VM availability
$result = azsize check $VmSize --region $Region --json | ConvertFrom-Json

if ($result.vm.available) {
    Write-Host "✓ $VmSize is available in $Region" -ForegroundColor Green
    Write-Host "  Price: `$$($result.vm.pricePerMonth)/month" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "✗ $VmSize is NOT available in $Region" -ForegroundColor Red

    Write-Host "`nFinding alternatives..." -ForegroundColor Yellow
    azsize find $VmSize --limit 5

    exit 1
}
```

### Example: Find Best Region in PowerShell

```powershell
# find-best-region.ps1

param(
    [string]$VmSize = "Standard_E8s_v5"
)

Write-Host "Finding best region for $VmSize..." -ForegroundColor Cyan

$result = azsize find $VmSize --json | ConvertFrom-Json

if ($result.availableRegions -eq 0) {
    Write-Host "VM not available in any region!" -ForegroundColor Red
    exit 1
}

$bestRegion = $result.regions[0]

Write-Host "`n✓ Best region: $($bestRegion.region)" -ForegroundColor Green
Write-Host "  Display name: $($bestRegion.label)" -ForegroundColor Gray
Write-Host "  Price: `$$($bestRegion.price)/month" -ForegroundColor Gray

# Return region for use in scripts
return $bestRegion.region
```

---

## Node.js/JavaScript

### Example: Express API with azsize

```javascript
const express = require('express');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);
const app = express();

// Endpoint to check VM availability
app.get('/api/check-vm', async (req, res) => {
  const { vmSize, region } = req.query;

  if (!vmSize || !region) {
    return res.status(400).json({ error: 'vmSize and region required' });
  }

  try {
    const { stdout } = await execPromise(
      `azsize check ${vmSize} --region ${region} --json`
    );

    const result = JSON.parse(stdout);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to find best region
app.get('/api/find-region', async (req, res) => {
  const { vmSize } = req.query;

  if (!vmSize) {
    return res.status(400).json({ error: 'vmSize required' });
  }

  try {
    const { stdout } = await execPromise(
      `azsize find ${vmSize} --json --limit 1`
    );

    const result = JSON.parse(stdout);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('API listening on port 3000');
});
```

### Example: Deployment Helper Module

```javascript
// vm-helper.js
const { execSync } = require('child_process');

class VMHelper {
  /**
   * Check if a VM is available in a region
   */
  static checkAvailability(vmSize, region) {
    try {
      const output = execSync(
        `azsize check ${vmSize} --region ${region} --json`,
        { encoding: 'utf-8' }
      );

      return JSON.parse(output);
    } catch (error) {
      throw new Error(`Failed to check VM: ${error.message}`);
    }
  }

  /**
   * Find best region for a VM (cheapest with availability)
   */
  static findBestRegion(vmSize) {
    try {
      const output = execSync(
        `azsize find ${vmSize} --json --limit 1`,
        { encoding: 'utf-8' }
      );

      const result = JSON.parse(output);

      if (result.availableRegions === 0) {
        throw new Error(`VM ${vmSize} not available in any region`);
      }

      return result.regions[0];
    } catch (error) {
      throw new Error(`Failed to find region: ${error.message}`);
    }
  }

  /**
   * Check VM with fallback to alternative region
   */
  static async checkWithFallback(vmSize, preferredRegion) {
    const check = this.checkAvailability(vmSize, preferredRegion);

    if (check.vm.available) {
      return {
        region: preferredRegion,
        available: true,
        price: check.vm.pricePerMonth
      };
    }

    // Find alternative
    const alternative = this.findBestRegion(vmSize);

    return {
      region: alternative.region,
      available: true,
      price: alternative.price,
      fallback: true
    };
  }
}

module.exports = VMHelper;

// Usage
const VMHelper = require('./vm-helper');

async function deploy() {
  const result = await VMHelper.checkWithFallback('Standard_D4s_v5', 'eastus');

  console.log(`Deploying to ${result.region}`);
  console.log(`Price: $${result.price}/month`);

  if (result.fallback) {
    console.log('⚠️  Using fallback region');
  }
}

deploy();
```

---

## Python Integration

### Example: Python Wrapper

```python
#!/usr/bin/env python3

import subprocess
import json
import sys

class AzSize:
    """Python wrapper for azsize CLI"""

    @staticmethod
    def check(vm_size, region):
        """Check if VM is available in a region"""
        try:
            result = subprocess.run(
                ['azsize', 'check', vm_size, '--region', region, '--json'],
                capture_output=True,
                text=True,
                check=True
            )

            return json.loads(result.stdout)
        except subprocess.CalledProcessError as e:
            raise Exception(f"Failed to check VM: {e.stderr}")

    @staticmethod
    def find(vm_size, limit=None):
        """Find all regions where VM is available"""
        cmd = ['azsize', 'find', vm_size, '--json']

        if limit:
            cmd.extend(['--limit', str(limit)])

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )

            return json.loads(result.stdout)
        except subprocess.CalledProcessError as e:
            raise Exception(f"Failed to find VM: {e.stderr}")

    @staticmethod
    def compare(vm_size, regions):
        """Compare VM across multiple regions"""
        regions_str = ','.join(regions)

        try:
            result = subprocess.run(
                ['azsize', 'compare', vm_size, '--regions', regions_str, '--json'],
                capture_output=True,
                text=True,
                check=True
            )

            return json.loads(result.stdout)
        except subprocess.CalledProcessError as e:
            raise Exception(f"Failed to compare: {e.stderr}")

# Usage example
if __name__ == '__main__':
    # Check VM availability
    result = AzSize.check('Standard_D4s_v5', 'eastus')

    if result['vm']['available']:
        print(f"✓ VM available in eastus")
        print(f"  Price: ${result['vm']['pricePerMonth']}/month")
    else:
        print("✗ VM not available, finding alternatives...")
        alternatives = AzSize.find('Standard_D4s_v5', limit=3)

        for region in alternatives['regions']:
            print(f"  {region['region']}: ${region['price']}/month")
```

### Example: Deployment Script

```python
#!/usr/bin/env python3

import sys
from azsize_wrapper import AzSize

def deploy_vm(vm_size, preferred_region):
    """Deploy VM with availability check"""

    print(f"Checking {vm_size} in {preferred_region}...")

    check = AzSize.check(vm_size, preferred_region)

    if check['vm']['available']:
        deploy_region = preferred_region
        print(f"✓ Using preferred region: {deploy_region}")
    else:
        print("⚠️  Preferred region unavailable, finding alternative...")

        alternatives = AzSize.find(vm_size, limit=1)

        if alternatives['availableRegions'] == 0:
            print("❌ VM not available in any region!")
            sys.exit(1)

        deploy_region = alternatives['regions'][0]['region']
        print(f"✓ Using alternative: {deploy_region}")

    # Deploy using Azure SDK
    print(f"Deploying to {deploy_region}...")
    # Add your Azure deployment code here

    return deploy_region

if __name__ == '__main__':
    deploy_vm('Standard_D4s_v5', 'eastus')
```

---

## Docker

### Dockerfile with azsize

```dockerfile
FROM node:18-alpine

# Install azsize globally
RUN npm install -g azsize

# Your app code
WORKDIR /app
COPY . .

RUN npm install

# Healthcheck script using azsize
COPY healthcheck.sh /healthcheck.sh
RUN chmod +x /healthcheck.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD /healthcheck.sh

CMD ["npm", "start"]
```

### healthcheck.sh
```bash
#!/bin/sh

# Check if required VMs are available
azsize check Standard_D4s_v5 --region eastus --json > /tmp/vm-check.json

AVAILABLE=$(cat /tmp/vm-check.json | jq -r '.vm.available')

if [ "$AVAILABLE" = "true" ]; then
    exit 0
else
    exit 1
fi
```

---

## Best Practices

### 1. **Cache Results**
```bash
# Cache VM availability check for 5 minutes
CACHE_FILE="/tmp/vm-check-$(date +%Y%m%d%H%M).json"

if [ ! -f "$CACHE_FILE" ]; then
    azsize check Standard_D4s_v5 --region eastus --json > "$CACHE_FILE"
fi

AVAILABLE=$(cat "$CACHE_FILE" | jq -r '.vm.available')
```

### 2. **Error Handling**
```bash
# Always check exit codes
if ! azsize check Standard_D4s_v5 --region eastus; then
    echo "Check failed, falling back to alternative region"
    azsize find Standard_D4s_v5 --limit 1
fi
```

### 3. **Logging**
```bash
# Log all azsize commands for audit trail
azsize check Standard_D4s_v5 --region eastus | tee -a /var/log/vm-checks.log
```

### 4. **Parallel Checks**
```bash
# Check multiple VMs in parallel
{
    azsize check Standard_D4s_v5 --region eastus --json > d4.json &
    azsize check Standard_E8s_v5 --region eastus --json > e8.json &
    wait
}
```

### 5. **CI/CD Integration**
- Always check VM availability **before** deploying
- Use `--json` output for programmatic parsing
- Set timeouts to avoid hanging pipelines
- Cache results to avoid rate limiting (if applicable in future)

---

## Example: Complete CI/CD Workflow

```yaml
name: Production Deploy

on:
  push:
    branches: [production]

env:
  VM_SIZE: Standard_D4s_v5
  PREFERRED_REGION: eastus

jobs:
  pre-deploy-checks:
    runs-on: ubuntu-latest
    outputs:
      deploy_region: ${{ steps.find-region.outputs.region }}

    steps:
      - name: Install azsize
        run: npm install -g azsize

      - name: Check preferred region
        id: check-preferred
        run: |
          AVAILABLE=$(azsize check ${{ env.VM_SIZE }} --region ${{ env.PREFERRED_REGION }} --json | jq -r '.vm.available')
          echo "available=$AVAILABLE" >> $GITHUB_OUTPUT

      - name: Find alternative if needed
        id: find-region
        run: |
          if [ "${{ steps.check-preferred.outputs.available }}" = "true" ]; then
            echo "region=${{ env.PREFERRED_REGION }}" >> $GITHUB_OUTPUT
          else
            REGION=$(azsize find ${{ env.VM_SIZE }} --json --limit 1 | jq -r '.regions[0].region')
            echo "region=$REGION" >> $GITHUB_OUTPUT
            echo "⚠️ Using fallback region: $REGION"
          fi

  deploy:
    needs: pre-deploy-checks
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to ${{ needs.pre-deploy-checks.outputs.deploy_region }}
        run: |
          echo "Deploying to ${{ needs.pre-deploy-checks.outputs.deploy_region }}"
          # Your deployment commands here
```

---

## Getting Help

- **CLI Documentation**: [README.md](./README.md)
- **GitHub Issues**: https://github.com/bajafresh-InfraSec/azsize/issues
- **Website**: https://www.azsize.com
- **Email**: feedback@azsize.com

---

## Contributing

Found a use case we didn't cover? Submit a PR with your integration example!

---

*Built for DevOps teams by [azsize.com](https://www.azsize.com)*
