/*
 * Create and export configuration vairiables.
 */

// Container for all the environments.
const environments = {}

// Staging (default) environment
environments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging'
}

// Production environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production'
}

// Determine the environment passed as a cli argument.
var currentEnv = ''

if (typeof(process.env.NODE_ENV) == 'string') {
    currentEnv = process.env.NODE_ENV.toLowerCase()
}

// Check that the current environment passed exist, if not, default to staging.
var environmentToExport = environments.staging

if (typeof(environments[currentEnv]) == 'object') {
    environmentToExport = environments[currentEnv]
}
``
// Export the module
module.exports = environmentToExport

