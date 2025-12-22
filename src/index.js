const { program } = require('commander');
const checkCommand = require('./commands/check');
const compareCommand = require('./commands/compare');
const listCommand = require('./commands/list');
const findCommand = require('./commands/find');
const authCommand = require('./commands/auth');

program
  .name('azsize')
  .description('Check Azure VM availability across regions')
  .version('0.1.2');

// Check command
program
  .command('check <vmSize>')
  .description('Check if a VM size is available in a specific region')
  .option('-r, --region <region>', 'Azure region (e.g., eastus, westus2)', 'eastus')
  .option('-j, --json', 'Output as JSON')
  .option('-c, --csv', 'Output as CSV')
  .action(checkCommand);

// Compare command
program
  .command('compare <vmSize>')
  .description('Compare VM availability across multiple regions')
  .option('-r, --regions <regions>', 'Comma-separated list of regions', 'eastus,westus2,centralus')
  .option('-j, --json', 'Output as JSON')
  .option('-c, --csv', 'Output as CSV')
  .action(compareCommand);

// List command
program
  .command('list <type>')
  .description('List available regions or VM series (use: regions or series)')
  .action(listCommand);

// Find command
program
  .command('find <vmSize>')
  .description('Find all regions where a VM size is available (searches all 49 regions)')
  .option('-j, --json', 'Output as JSON')
  .option('-c, --csv', 'Output as CSV')
  .option('-l, --limit <number>', 'Limit number of results shown', parseInt)
  .action(findCommand);

// Auth command
program
  .command('auth [action]')
  .description('Manage API key authentication (run without args to see status)')
  .action(authCommand);

program.parse(process.argv);
