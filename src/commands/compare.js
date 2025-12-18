const ora = require('ora');
const { checkAvailability } = require('../utils/api-client');
const { formatComparisonTable, formatJSON, showError } = require('../utils/formatter');

/**
 * Compare command - Compare VM availability across multiple regions
 */
async function compareCommand(vmSize, options) {
  const { regions, json, csv } = options;
  const regionList = regions.split(',').map(r => r.trim());

  const spinner = ora(`Comparing ${vmSize} across ${regionList.length} regions...`).start();

  try {
    // Determine the series filter from the VM size
    const seriesMatch = vmSize.match(/^(Standard_[A-Z])/);
    const seriesFilter = seriesMatch ? seriesMatch[1] : 'Standard_D';

    // Fetch data for all regions in parallel
    const promises = regionList.map(region =>
      checkAvailability(region, seriesFilter)
        .then(data => ({ region, data }))
        .catch(error => ({ region, error: error.message }))
    );

    const results = await Promise.all(promises);

    // Build comparison map
    const compareResults = {};
    results.forEach(result => {
      if (result.data) {
        compareResults[result.region] = result.data;
      } else {
        compareResults[result.region] = { error: result.error };
      }
    });

    spinner.succeed(`Compared ${vmSize} across ${regionList.length} regions`);

    // Format output based on options
    if (json) {
      const jsonOutput = {};
      regionList.forEach(region => {
        const data = compareResults[region];
        const vm = data.vms ? data.vms.find(v => v.name === vmSize) : null;
        jsonOutput[region] = vm || { error: 'VM not found' };
      });
      formatJSON(jsonOutput);
    } else if (csv) {
      console.log('Region,VM Size,Available,Price/mo,Restriction');
      regionList.forEach(region => {
        const data = compareResults[region];
        const vm = data.vms ? data.vms.find(v => v.name === vmSize) : null;
        if (vm) {
          console.log(`${region},${vm.name},${vm.available},${vm.pricePerMonth || 'N/A'},${vm.restriction || 'None'}`);
        } else {
          console.log(`${region},${vmSize},false,N/A,Not found`);
        }
      });
    } else {
      formatComparisonTable(compareResults, vmSize);

      // Show summary
      const availableCount = regionList.filter(region => {
        const data = compareResults[region];
        const vm = data.vms ? data.vms.find(v => v.name === vmSize) : null;
        return vm && vm.available;
      }).length;

      console.log(`\n${vmSize} is available in ${availableCount}/${regionList.length} regions`);
    }

  } catch (error) {
    spinner.fail('Failed to compare VM availability');
    showError(error.message);
    process.exit(1);
  }
}

module.exports = compareCommand;
