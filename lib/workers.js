/*
 * Worker-related tasks.
 */

// Dependencies.
const path = require('path')
const fs = require('fs')
const _data = require('./data')
const http = require('http')
const https = require('https')
const helpers = require('./helpers')
const url = require('url')

// Instantiate the worker object.
const workers = {}

// Lookup all checks, get their data, send to a validator.
workers.gatherAllChecks = function() {
    // Get all the checks.
    _data.list('checks', (err, checks) => {
        if (!err && checks && checks.length > 0) {
            checks.forEach(check => {
                // Read in the check data.
                _data.read('check', check, (err, originalCheckData) => {
                    if (!err && originalCheckData) {
                        // Pass it to the check validator, and let that function continue or log errors as needed.
                        workers.validateCheckData(originalCheckData)
                    } else {
                        console.log('Error reading one of the checks data')
                    }
                })
            });
        } else {
            console.log('Error: Could not find any checks to process')
        }
    }) 
}

// Sanity-check the check data.
workers.validateCheckData = function(originalCheckData) {
    originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData !== null ? originalCheckData : {}
    originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim() : false
    originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length == 10 ? originalCheckData.userPhone.trim() : false
    originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false
    originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false
    originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['post', 'get' 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false
    originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes > 0 ? originalCheckData.successCodes : false
    originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false

    // Set the keys that may not be set (if the workers have neever seen this check before).
    originalCheckData.state = typeof(originalCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down'
    originalCheckData.lastCheck = typeof(originalCheckData.lastCheck) == 'number' && originalCheckData.lastCheck > 0 ? originalCheckData.lastCheck : false

    // If all the checks pass, pass the data along to the next step in the process.
    if (originalCheckData && originalCheckData.id && originalCheckData.userPhone && originalCheckData.protocol && 
            originalCheckData.url && originalCheckData.method && originalCheckData.successCodes && originalCheckData.timeoutSeconds) {
        workers.performCheck(originalCheckData)
    } else {
        console.log('Error: One of the checks is not properly formatted. Skipping it.')
    }

}

// Perform the check, send the originalCheckData and the outcome of the check to thenext step of the process.
workers.performCheck = originalCheckData => {
    // Prepare the initial check outcome.
    const checkOutcome = {
        'error': false,
        'responseCode': false
    }

    // Mark that the outcome has not been sent yet.
    const outcomeSent = false

    // Parse the hostname and the path out of the originalCheckData.
    const parsedUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url, true)
    const hostName = parsedUrl.hostname
    const path = parsedUrl.path // Using path and not "pathname" becaue we want the query string.

    // Construct the request.
    const requestDetails =  {
        'protocol': originalCheckData.protocol + ':',
        'hostname': hostName,
        'method': originalCheckData.method.toUpperCase(),
        'path': path,
        'timeout': originalCheckData.timeoutSeconds * 1000,
    }

    // Instantiate the request object (using either the http or https module).
    const _moduleToUse = originalCheckData.protocol == 'http' ? http : https
    const req = _moduleToUse.request(requestDetails, res => {
        // Grab the status of the sent request.
        const status = res.statusCode
        
        // Update the checkOutcome and pass the data along.
        checkOutcome.responseCode = status
        if (!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome)
            outcomeSent = true
        }
    })

    // Bind to the error event so it doesnt get thrown.
    req.on('error', err => {
        // Update the checkOutcome and pass the data along.
        checkOutcome.error = {
            'error': true, 
            'value': err
        }
        if (!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome)
            outcomeSent = true
        }
    })

    // Bind to the timeout event.
    req.on('timeout', err => {
        // Update the checkOutcome and pass the data along.
        checkOutcome.error = {
            'error': true, 
            'value': 'timeout'
        }
        if (!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome)
            outcomeSent = true
        }
    })

    // End the request. (send)
    req.end()

}

// Process the check outcome, update the check data as needed, trigger an alert to the user if needed.
// Special logic for accomodating a check that has been tested before (don't alert on that one).
workers.processCheckOutcome = (originalCheckData, checkOutcome) => {
    
}

// Timer to execute the worker-process once per minute.
workers.loop = function() {
    setInterval(() => {
        workers.gatherAllChecks()
    }, 1000 * 60)
}

// Init the script.
workers.init = function() {
    // Execute all the checks immediatly.
    workers.gatherAllChecks()

    // Call the loop so the checks will execute later on.
    workers.loop()
}

// Export the module.
module.exports = workers

