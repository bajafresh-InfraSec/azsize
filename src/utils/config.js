const Conf = require('conf');
const path = require('path');
const os = require('os');

// Create config instance
const config = new Conf({
  projectName: 'azsize',
  cwd: path.join(os.homedir(), '.azsize'),
  configName: 'config'
});

/**
 * Set API key
 * @param {string} apiKey - The API key to store
 */
function setApiKey(apiKey) {
  if (!apiKey || !apiKey.startsWith('azsk_')) {
    throw new Error('Invalid API key format. API keys should start with "azsk_"');
  }
  config.set('apiKey', apiKey);
}

/**
 * Get API key
 * @returns {string|null} - The stored API key or null
 */
function getApiKey() {
  return config.get('apiKey', null);
}

/**
 * Clear API key
 */
function clearApiKey() {
  config.delete('apiKey');
}

/**
 * Check if API key is configured
 * @returns {boolean}
 */
function hasApiKey() {
  return config.has('apiKey');
}

module.exports = {
  setApiKey,
  getApiKey,
  clearApiKey,
  hasApiKey
};
