/*
 * Create and export configuration vairiables.
 */

// Container for all the environments.
const environments = {}

// Staging (default) environment
environments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
    'hashingSecret': 'thisIsASecret',
    'maxChecks': 5,
    'twilio': {
        'accountSid': 'ACfe4e9a647013275ac7ffd4cb1cffeb25',
        'authToken': 'f7e261510fb7c99c0be46ac375758c39',
        'fromPhone': '+12566662305',
    }
}

// Production environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret': 'thisIsAlsoASecret',
    'maxChecks': 5,
    'twilio': {
        'accountSid': 'ACfe4e9a647013275ac7ffd4cb1cffeb25',
        'authToken': 'f7e261510fb7c99c0be46ac375758c39',
        'fromPhone': '+12566662305',
    }
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

