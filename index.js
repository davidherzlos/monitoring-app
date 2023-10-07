/*
 * Primary file for the API.
 */

// Dependencies.
const server = require('./lib/server')
const workers = require('./lib/workers')

// Declare the app.
var app = {}

// Init function.
app.init = function() {
    // Start the server.
    server.init()

    // Start thr workers.
    workers.init()
}

// Execute.
app.init()

// Export the app.
module.exports = app