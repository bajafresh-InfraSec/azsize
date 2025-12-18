const ora = require('ora');
const chalk = require('chalk');
const { checkAvailability, getHistoricalData } = require('../utils/api-client');
const { formatTable, formatJSON, formatCSV, showError } = require('../utils/formatter');

/**
 * Check command - Check if a VM size is available in a specific region
 */
async function checkCommand(vmSize, options) {
  const { region, json, csv } = options;

  const spinner = ora(`Checking ${vmSize} in ${region}...`).start();

  try {
    // Determine the series filter from the VM size
    const seriesMatch = vmSize.match(/^(Standard_[A-Z])/);
    const seriesFilter = seriesMatch ? seriesMatch[1] : 'Standard_D';

    // Fetch availability data
    const data = await checkAvailability(region, seriesFilter);

    if (!data || !data.vms) {
      spinner.fail('No data returned from API');
      showError('Failed to fetch VM availability data');
      process.exit(1);
    }

    // Find the specific VM
    const vm = data.vms.find(v => v.name === vmSize);

    if (!vm) {
      spinner.fail(`VM size ${vmSize} not found in ${region}`);
      showError(`VM size ${vmSize} not found in series ${seriesFilter}. Try 'azsize list series' to see available series.`);
      process.exit(1);
    }

    // Try to get historical data
    let historicalData = {};
    const historical = await getHistoricalData(vmSize, region, 7);
    if (historical && historical.data) {
      historicalData[vmSize] = historical.data;
    }

    spinner.succeed(`Found ${vmSize} in ${region}`);

    // Format output based on options
    if (json) {
      formatJSON({ region, vm, historical: historicalData[vmSize] || null });
    } else if (csv) {
      formatCSV([vm], region);
    } else {
      formatTable([vm], region, historicalData);

      // Show summary
      if (vm.available) {
        console.log(`\n✓ ${vmSize} is ${chalk.green('AVAILABLE')} in ${region}`);
      } else {
        console.log(`\n✗ ${vmSize} is ${chalk.red('NOT AVAILABLE')} in ${region}`);
        if (vm.restriction) {
          console.log(`  Reason: ${vm.restriction}`);
        }
      }
    }

  } catch (error) {
    spinner.fail('Failed to check VM availability');
    showError(error.message);
    process.exit(1);
  }
}

module.exports = checkCommand;
