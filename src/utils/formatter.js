const chalk = require('chalk');
const Table = require('cli-table3');

/**
 * Format VM data as a pretty table
 * @param {Array} vms - Array of VM objects
 * @param {string} region - Region name
 * @param {Object} historicalData - Optional historical data map
 */
function formatTable(vms, region, historicalData = {}) {
  const table = new Table({
    head: [
      chalk.cyan('VM Size'),
      chalk.cyan('vCPUs'),
      chalk.cyan('Memory (GB)'),
      chalk.cyan('Price/mo'),
      chalk.cyan('Available'),
      chalk.cyan('7-day %')
    ],
    colWidths: [25, 8, 15, 12, 12, 10]
  });

  vms.forEach(vm => {
    const available = vm.available ? chalk.green('✓ Yes') : chalk.red('✗ No');
    const historical = historicalData[vm.name]
      ? `${historicalData[vm.name].toFixed(1)}%`
      : 'N/A';

    table.push([
      vm.name,
      vm.vCPUs || 'N/A',
      vm.memoryGB || 'N/A',
      vm.pricePerMonth ? `$${vm.pricePerMonth}` : 'N/A',
      available,
      historical
    ]);
  });

  console.log(`\n${chalk.bold(`Region: ${region}`)}`);
  console.log(table.toString());

  // Show restrictions if any
  const restrictedVms = vms.filter(vm => !vm.available && vm.restriction);
  if (restrictedVms.length > 0) {
    console.log(`\n${chalk.yellow('Restrictions:')}`);
    restrictedVms.forEach(vm => {
      console.log(`  ${chalk.dim(vm.name)}: ${vm.restriction}`);
    });
  }
}

/**
 * Format comparison data across multiple regions
 * @param {Object} compareResults - Map of region -> VM data
 * @param {string} vmSize - VM size being compared
 */
function formatComparisonTable(compareResults, vmSize) {
  const regions = Object.keys(compareResults);

  console.log(`\n${chalk.bold(`Comparing ${vmSize} across ${regions.length} regions`)}\n`);

  const table = new Table({
    head: [
      chalk.cyan('Region'),
      chalk.cyan('Available'),
      chalk.cyan('Price/mo'),
      chalk.cyan('Restriction')
    ],
    colWidths: [20, 12, 12, 40]
  });

  regions.forEach(region => {
    const data = compareResults[region];
    const vm = data.vms ? data.vms.find(v => v.name === vmSize) : null;

    if (vm) {
      const available = vm.available ? chalk.green('✓ Yes') : chalk.red('✗ No');
      const price = vm.pricePerMonth ? `$${vm.pricePerMonth}` : 'N/A';
      const restriction = vm.restriction || 'None';

      table.push([region, available, price, restriction]);
    } else {
      table.push([region, chalk.dim('Not found'), chalk.dim('N/A'), chalk.dim('N/A')]);
    }
  });

  console.log(table.toString());
}

/**
 * Format as JSON
 * @param {Object} data - Data to format
 */
function formatJSON(data) {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Format as CSV
 * @param {Array} vms - Array of VM objects
 * @param {string} region - Region name
 */
function formatCSV(vms, region) {
  console.log('VM Size,vCPUs,Memory (GB),Price/mo,Available,Restriction,Region');
  vms.forEach(vm => {
    console.log(`${vm.name},${vm.vCPUs || 'N/A'},${vm.memoryGB || 'N/A'},${vm.pricePerMonth || 'N/A'},${vm.available},${vm.restriction || 'None'},${region}`);
  });
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  console.error(chalk.red(`\n✗ Error: ${message}\n`));
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
  console.log(chalk.green(`\n✓ ${message}\n`));
}

/**
 * Show info message
 * @param {string} message - Info message
 */
function showInfo(message) {
  console.log(chalk.blue(`\nℹ ${message}\n`));
}

module.exports = {
  formatTable,
  formatComparisonTable,
  formatJSON,
  formatCSV,
  showError,
  showSuccess,
  showInfo
};
