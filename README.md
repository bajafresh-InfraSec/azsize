# azsize - Azure VM Availability CLI

Check Azure VM availability across all 49 regions from your command line. Perfect for DevOps workflows, CI/CD pipelines, and automation scripts.

**Web Version:** [www.azsize.com](https://www.azsize.com)

![npm version](https://img.shields.io/npm/v/azsize) ![license](https://img.shields.io/npm/l/azsize)

## Features

- ✅ Check VM availability in any Azure region
- ✅ Compare availability across multiple regions
- ✅ View pricing and specifications
- ✅ See historical availability data (7-day trends)
- ✅ Export as JSON or CSV
- ✅ Fast, real-time data from Azure APIs
- ✅ Works offline-friendly (caches region/series lists)

## Installation

```bash
npm install -g azsize
```

## Quick Start

```bash
# Check if a VM is available in a region
azsize check Standard_D4s_v5 --region eastus

# Compare across multiple regions
azsize compare Standard_D4s_v5 --regions eastus,westus2,centralus

# List all available regions
azsize list regions

# List all VM series
azsize list series
```

## Commands

### `check` - Check VM Availability

Check if a specific VM size is available in a region.

```bash
azsize check <vmSize> [options]
```

**Options:**
- `-r, --region <region>` - Azure region (default: eastus)
- `-j, --json` - Output as JSON
- `-c, --csv` - Output as CSV

**Examples:**
```bash
# Basic check
azsize check Standard_D4s_v5 --region eastus

# Check with JSON output
azsize check Standard_E8s_v5 --region westus2 --json

# Check with CSV output
azsize check Standard_F16s_v2 --region centralus --csv
```

### `find` - Find Available Regions (NEW in v0.1.1)

Find all regions where a VM size is available. Searches all 49 regions and shows results sorted by price.

```bash
azsize find <vmSize> [options]
```

**Options:**
- `-l, --limit <number>` - Limit number of results shown
- `-j, --json` - Output as JSON
- `-c, --csv` - Output as CSV

**Examples:**
```bash
# Find all regions where VM is available
azsize find Standard_D2s_v3

# Show only top 5 cheapest regions
azsize find Standard_D2s_v3 --limit 5

# Output as JSON
azsize find Standard_E8s_v5 --json
```

### `compare` - Compare Across Regions

Compare VM availability across multiple regions.

```bash
azsize compare <vmSize> [options]
```

**Options:**
- `-r, --regions <regions>` - Comma-separated list of regions (default: eastus,westus2,centralus)
- `-j, --json` - Output as JSON
- `-c, --csv` - Output as CSV

**Examples:**
```bash
# Compare across default regions
azsize compare Standard_D4s_v5

# Compare across custom regions
azsize compare Standard_E8s_v5 --regions eastus,westus,northeurope,southeastasia

# Compare with JSON output
azsize compare Standard_F16s_v2 --regions eastus,westus2 --json
```

### `list` - List Regions or Series

List all available Azure regions or VM series.

```bash
azsize list <type>
```

**Types:**
- `regions` - List all 49 Azure regions
- `series` - List all VM series (D, E, F, B, etc.)

**Examples:**
```bash
# List all regions
azsize list regions

# List all VM series
azsize list series
```

## Output Formats

### Table (Default)

Pretty-printed table with colors:

```
Region: eastus
┌─────────────────────────┬────────┬───────────────┬────────────┬────────────┬──────────┐
│ VM Size                 │ vCPUs  │ Memory (GB)   │ Price/mo   │ Available  │ 7-day %  │
├─────────────────────────┼────────┼───────────────┼────────────┼────────────┼──────────┤
│ Standard_D4s_v5         │ 4      │ 16            │ $140       │ ✓ Yes      │ 98.5%    │
└─────────────────────────┴────────┴───────────────┴────────────┴────────────┴──────────┘
```

### JSON (`--json`)

Machine-readable JSON format:

```json
{
  "region": "eastus",
  "vm": {
    "name": "Standard_D4s_v5",
    "vCPUs": 4,
    "memoryGB": 16,
    "pricePerMonth": 140,
    "available": true,
    "restriction": null
  },
  "historical": 98.5
}
```

### CSV (`--csv`)

CSV format for spreadsheets:

```csv
VM Size,vCPUs,Memory (GB),Price/mo,Available,Restriction,Region
Standard_D4s_v5,4,16,140,true,None,eastus
```

## Use Cases

### CI/CD Pipeline

```bash
#!/bin/bash
# Check if VM is available before deployment
if azsize check Standard_D4s_v5 --region eastus --json | jq -r '.vm.available' | grep -q true; then
  echo "VM available, proceeding with deployment"
  terraform apply
else
  echo "VM not available, trying alternate region"
  terraform apply -var="region=westus2"
fi
```

### Find Best Region

```bash
# Find which regions have a VM available
azsize compare Standard_D4s_v5 --regions eastus,westus2,centralus,northeurope --csv \
  | grep "true" \
  | cut -d',' -f1
```

### Automated Monitoring

```bash
# Monitor VM availability and alert if it drops
while true; do
  AVAILABLE=$(azsize check Standard_D4s_v5 --region eastus --json | jq -r '.vm.available')
  if [ "$AVAILABLE" != "true" ]; then
    echo "ALERT: Standard_D4s_v5 no longer available in eastus" | mail -s "VM Alert" admin@example.com
  fi
  sleep 3600
done
```

## API

The CLI calls the free public API at [www.azsize.com](https://www.azsize.com).

- No authentication required
- No rate limits
- Real-time data from Azure APIs
- Historical data tracked hourly

## Supported Regions

All 49 Azure regions including:
- US: East US, West US, Central US, etc.
- Europe: North Europe, West Europe, UK South, etc.
- Asia: Southeast Asia, East Asia, Japan East, etc.
- And more...

Run `azsize list regions` for the full list.

## Supported VM Series

- **A-series**: Basic, entry-level VMs
- **B-series**: Burstable, cost-effective
- **D-series**: General purpose
- **E-series**: Memory optimized
- **F-series**: Compute optimized
- **G-series**: Memory and storage optimized
- **H-series**: High-performance compute
- **L-series**: Storage optimized
- **M-series**: Largest memory VMs
- **N-series**: GPU-enabled VMs

Run `azsize list series` for the full list.

## Troubleshooting

### Command not found

Make sure azsize is installed globally:
```bash
npm install -g azsize
```

### Connection errors

Check your internet connection and firewall. The CLI needs to access `https://www.azsize.com/api`.

### VM not found

Make sure you're using the correct VM size name (e.g., `Standard_D4s_v5` not `D4s_v5`). Use `azsize list series` to see available series.

## Contributing

Contributions welcome! Please open an issue or PR at:
https://github.com/bajafresh-InfraSec/azsize

## License

MIT License - see LICENSE file for details

## Links

- **Website**: https://www.azsize.com
- **GitHub**: https://github.com/bajafresh-InfraSec/azsize
- **NPM**: https://www.npmjs.com/package/azsize
- **Issues**: https://github.com/bajafresh-InfraSec/azsize/issues

## Support

- Open an issue on GitHub
- Email: feedback@azsize.com
- Website feedback form: https://www.azsize.com

---

Built for the Azure community by [azsize.com](https://www.azsize.com)
