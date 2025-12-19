const ora = require('ora');
const chalk = require('chalk');
const { checkAvailability, AZURE_REGIONS } = require('../utils/api-client');
const { formatJSON, showError } = require('../utils/formatter');
const Table = require('cli-table3');

/**
 * Find command - Find all regions where a VM size is available
 */
async function findCommand(vmSize, options) {
  const { json, csv, limit } = options;

  const spinner = ora(`Searching all 49 regions for ${vmSize}...`).start();

  try {
    // Determine the series filter from the VM size
    const seriesMatch = vmSize.match(/^(Standard_[A-Z])/);
    const seriesFilter = seriesMatch ? seriesMatch[1] : 'Standard_D';

    // Fetch data for all regions in parallel
    const promises = AZURE_REGIONS.map(region =>
      checkAvailability(region.value, seriesFilter)
        .then(data => ({
          region: region.value,
          label: region.label,
          data
        }))
        .catch(error => ({
          region: region.value,
          label: region.label,
          error: error.message
        }))
    );

    const results = await Promise.all(promises);

    // Filter to only regions where VM is available
    const availableRegions = [];

    results.forEach(result => {
      if (result.data && result.data.vms) {
        const vm = result.data.vms.find(v => v.name === vmSize);
        if (vm && vm.available) {
          availableRegions.push({
            region: result.region,
            label: result.label,
            price: vm.pricePerMonth || 0,
            vCPUs: vm.vCPUs,
            memoryGB: vm.memoryGB,
            restriction: vm.restriction || 'None'
          });
        }
      }
    });

    spinner.succeed(`Searched 49 regions, found ${availableRegions.length} available`);

    if (availableRegions.length === 0) {
      console.log(chalk.yellow(`\n${vmSize} is not available in any region right now.\n`));
      return;
    }

    // Sort by price (cheapest first)
    availableRegions.sort((a, b) => a.price - b.price);

    // Apply limit if specified
    const displayRegions = limit ? availableRegions.slice(0, limit) : availableRegions;

    // Format output based on options
    if (json) {
      formatJSON({
        vmSize,
        totalRegions: AZURE_REGIONS.length,
        availableRegions: displayRegions.length,
        regions: displayRegions
      });
    } else if (csv) {
      console.log('Region,Display Name,Price/mo,vCPUs,Memory (GB),Restriction');
      displayRegions.forEach(r => {
        console.log(`${r.region},${r.label},$${r.price},${r.vCPUs},${r.memoryGB},${r.restriction}`);
      });
    } else {
      // Pretty table output
      console.log(`\n${chalk.bold(`${vmSize} - Available Regions`)}`);
      console.log(chalk.dim(`Sorted by price (cheapest first)\n`));

      const table = new Table({
        head: [
          chalk.cyan('Region'),
          chalk.cyan('Display Name'),
          chalk.cyan('Price/mo'),
          chalk.cyan('vCPUs'),
          chalk.cyan('Memory')
        ],
        colWidths: [20, 25, 12, 8, 10]
      });

      displayRegions.forEach(r => {
        table.push([
          r.region,
          r.label,
          chalk.green(`$${r.price}`),
          r.vCPUs,
          `${r.memoryGB} GB`
        ]);
      });

      console.log(table.toString());

      // Show summary
      console.log(`\n${chalk.green('✓')} Available in ${availableRegions.length}/${AZURE_REGIONS.length} regions`);

      if (availableRegions.length > 0) {
        const cheapest = availableRegions[0];
        const mostExpensive = availableRegions[availableRegions.length - 1];
        console.log(chalk.dim(`  Cheapest: ${cheapest.region} ($${cheapest.price}/mo)`));
        console.log(chalk.dim(`  Most expensive: ${mostExpensive.region} ($${mostExpensive.price}/mo)`));
      }

      if (limit && availableRegions.length > limit) {
        console.log(chalk.dim(`\n  Showing ${limit} of ${availableRegions.length} regions. Use --limit to see more.\n`));
      } else {
        console.log('');
      }
    }

  } catch (error) {
    spinner.fail('Failed to search regions');
    showError(error.message);
    process.exit(1);
  }
}

module.exports = findCommand;
