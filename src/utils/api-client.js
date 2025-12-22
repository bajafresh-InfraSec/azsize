const axios = require('axios');
const { getApiKey } = require('./config');

const API_BASE_URL = 'https://www.azsize.com/api';

/**
 * Get headers with API key if configured
 * @returns {Object} - Headers object
 */
function getHeaders() {
  const apiKey = getApiKey();
  if (apiKey) {
    return {
      'X-API-Key': apiKey
    };
  }
  return {};
}

/**
 * Check VM availability in a specific region
 * @param {string} region - Azure region (e.g., 'eastus')
 * @param {string} seriesFilter - VM series filter (e.g., 'Standard_D')
 * @returns {Promise<Object>} - API response with VM availability data
 */
async function checkAvailability(region, seriesFilter = 'Standard_D') {
  try {
    const response = await axios.get(`${API_BASE_URL}/GetVMAvailability`, {
      params: { region, seriesFilter },
      headers: getHeaders()
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please authenticate with an API key to get more checks. Run: azsize auth');
    }
    throw new Error(`Failed to fetch availability: ${error.message}`);
  }
}

/**
 * Get historical availability data for a VM
 * @param {string} vmSize - VM size name (e.g., 'Standard_D4s_v5')
 * @param {string} region - Azure region
 * @param {number} days - Number of days to query (default: 7)
 * @returns {Promise<Object>} - Historical data
 */
async function getHistoricalData(vmSize, region, days = 7) {
  try {
    const response = await axios.get(`${API_BASE_URL}/GetHistoricalData`, {
      params: { vmSize, region, days, type: 'percentage' },
      headers: getHeaders()
    });
    return response.data;
  } catch (error) {
    // Historical data might not exist for all VMs, return null instead of throwing
    return null;
  }
}

/**
 * Azure regions list
 */
const AZURE_REGIONS = [
  { value: 'eastus', label: 'East US' },
  { value: 'eastus2', label: 'East US 2' },
  { value: 'westus', label: 'West US' },
  { value: 'westus2', label: 'West US 2' },
  { value: 'westus3', label: 'West US 3' },
  { value: 'centralus', label: 'Central US' },
  { value: 'northcentralus', label: 'North Central US' },
  { value: 'southcentralus', label: 'South Central US' },
  { value: 'westcentralus', label: 'West Central US' },
  { value: 'canadacentral', label: 'Canada Central' },
  { value: 'canadaeast', label: 'Canada East' },
  { value: 'brazilsouth', label: 'Brazil South' },
  { value: 'northeurope', label: 'North Europe' },
  { value: 'westeurope', label: 'West Europe' },
  { value: 'uksouth', label: 'UK South' },
  { value: 'ukwest', label: 'UK West' },
  { value: 'francecentral', label: 'France Central' },
  { value: 'francesouth', label: 'France South' },
  { value: 'germanywestcentral', label: 'Germany West Central' },
  { value: 'norwayeast', label: 'Norway East' },
  { value: 'switzerlandnorth', label: 'Switzerland North' },
  { value: 'swedencentral', label: 'Sweden Central' },
  { value: 'southafricanorth', label: 'South Africa North' },
  { value: 'uaenorth', label: 'UAE North' },
  { value: 'southeastasia', label: 'Southeast Asia' },
  { value: 'eastasia', label: 'East Asia' },
  { value: 'australiaeast', label: 'Australia East' },
  { value: 'australiasoutheast', label: 'Australia Southeast' },
  { value: 'centralindia', label: 'Central India' },
  { value: 'southindia', label: 'South India' },
  { value: 'westindia', label: 'West India' },
  { value: 'japaneast', label: 'Japan East' },
  { value: 'japanwest', label: 'Japan West' },
  { value: 'koreacentral', label: 'Korea Central' },
  { value: 'koreasouth', label: 'Korea South' },
  { value: 'chinanorth', label: 'China North' },
  { value: 'chinaeast', label: 'China East' },
  { value: 'chinanorth2', label: 'China North 2' },
  { value: 'chinaeast2', label: 'China East 2' },
  { value: 'germanycentral', label: 'Germany Central' },
  { value: 'germanynortheast', label: 'Germany Northeast' },
  { value: 'usgovvirginia', label: 'US Gov Virginia' },
  { value: 'usgoviowa', label: 'US Gov Iowa' },
  { value: 'usgovarizona', label: 'US Gov Arizona' },
  { value: 'usgovtexas', label: 'US Gov Texas' },
  { value: 'usdodeast', label: 'US DoD East' },
  { value: 'usdodcentral', label: 'US DoD Central' },
  { value: 'qatarcentral', label: 'Qatar Central' },
  { value: 'polandcentral', label: 'Poland Central' }
];

/**
 * VM Series list
 */
const VM_SERIES = [
  { value: 'Standard_A', label: 'A-series (Basic)' },
  { value: 'Standard_B', label: 'B-series (Burstable)' },
  { value: 'Standard_D', label: 'D-series (General Purpose)' },
  { value: 'Standard_E', label: 'E-series (Memory Optimized)' },
  { value: 'Standard_F', label: 'F-series (Compute Optimized)' },
  { value: 'Standard_G', label: 'G-series (Memory & Storage)' },
  { value: 'Standard_H', label: 'H-series (HPC)' },
  { value: 'Standard_L', label: 'L-series (Storage Optimized)' },
  { value: 'Standard_M', label: 'M-series (Large Memory)' },
  { value: 'Standard_N', label: 'N-series (GPU)' }
];

module.exports = {
  checkAvailability,
  getHistoricalData,
  AZURE_REGIONS,
  VM_SERIES
};
