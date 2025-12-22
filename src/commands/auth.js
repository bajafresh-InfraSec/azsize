const chalk = require('chalk');
const { setApiKey, getApiKey, clearApiKey, hasApiKey } = require('../utils/config');

/**
 * Auth command - Manage API key authentication
 */
async function authCommand(action, apiKey, options) {
  try {
    if (!action) {
      // Show current auth status
      if (hasApiKey()) {
        const key = getApiKey();
        const prefix = key.substring(0, 12);
        console.log(chalk.green('✓ Authenticated'));
        console.log(`API Key: ${prefix}...`);
        console.log(`\nYou have access to 50 checks per month.`);
        console.log(`Visit https://www.azsize.com/dashboard to view your usage.`);
      } else {
        console.log(chalk.yellow('Not authenticated'));
        console.log(`\nYou can make 1 free check without authentication.`);
        console.log(`\nTo get 50 checks per month:`);
        console.log(`1. Sign up at ${chalk.cyan('https://www.azsize.com/signup')}`);
        console.log(`2. Generate an API key at ${chalk.cyan('https://www.azsize.com/dashboard')}`);
        console.log(`3. Run: ${chalk.cyan('azsize auth <your-api-key>')}`);
      }
      return;
    }

    if (action === 'logout' || action === 'clear') {
      // Clear API key
      if (!hasApiKey()) {
        console.log(chalk.yellow('No API key configured'));
        return;
      }
      clearApiKey();
      console.log(chalk.green('✓ API key removed'));
      return;
    }

    // Assume action is the API key if it starts with azsk_
    if (action.startsWith('azsk_')) {
      setApiKey(action);
      console.log(chalk.green('✓ API key saved successfully!'));
      console.log(`\nYou now have access to 50 checks per month.`);
      console.log(`View your usage at ${chalk.cyan('https://www.azsize.com/dashboard')}`);
      return;
    }

    console.log(chalk.red('Invalid action or API key'));
    console.log(`\nUsage:`);
    console.log(`  azsize auth                  ${chalk.gray('# Show auth status')}`);
    console.log(`  azsize auth <api-key>        ${chalk.gray('# Set API key')}`);
    console.log(`  azsize auth logout           ${chalk.gray('# Remove API key')}`);

  } catch (error) {
    console.log(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

module.exports = authCommand;
