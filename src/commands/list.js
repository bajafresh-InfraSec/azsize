const chalk = require('chalk');
const Table = require('cli-table3');
const { AZURE_REGIONS, VM_SERIES } = require('../utils/api-client');
const { showError } = require('../utils/formatter');

/**
 * List command - List available regions or VM series
 */
function listCommand(type) {
  if (type === 'regions') {
    listRegions();
  } else if (type === 'series') {
    listSeries();
  } else {
    showError(`Invalid list type: ${type}. Use 'regions' or 'series'`);
    console.log('Usage: azsize list <regions|series>');
    process.exit(1);
  }
}

/**
 * List all Azure regions
 */
function listRegions() {
  console.log(chalk.bold('\nAzure Regions (49 total):\n'));

  const table = new Table({
    head: [chalk.cyan('Region Code'), chalk.cyan('Display Name')],
    colWidths: [25, 35]
  });

  AZURE_REGIONS.forEach(region => {
    table.push([region.value, region.label]);
  });

  console.log(table.toString());
  console.log(chalk.dim('\nExample: azsize check Standard_D4s_v5 --region eastus\n'));
}

/**
 * List all VM series
 */
function listSeries() {
  console.log(chalk.bold('\nAzure VM Series:\n'));

  const table = new Table({
    head: [chalk.cyan('Series Code'), chalk.cyan('Description')],
    colWidths: [20, 40]
  });

  VM_SERIES.forEach(series => {
    table.push([series.value, series.label]);
  });

  console.log(table.toString());
  console.log(chalk.dim('\nExample: azsize check Standard_D4s_v5 --region eastus\n'));
}

module.exports = listCommand;
