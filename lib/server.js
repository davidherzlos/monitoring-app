/*
 * Server-related tasks.
 */

// Dependencies
const http = require('http')
const https = require('https')
const url = require('url')
const StringDecoder = require('string_decoder').StringDecoder
const config = require('./config')
const fs = require('fs')
const handlers = require ('./handlers')
const helpers = require('./helpers')
const path = require('path')

// Instantiate the server module object.
const server = {}

// Instantiate the HTTP server.
server.httpServer = http.createServer((req, res) => {
    server.unifiedServer(req, res)
})

// Instantiate the HTTPS server.
server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname, '../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '../https/cert.pem')),
}

server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
    server.unifiedServer(req, res)
})

// All the server logic for both the http and https server.
server.unifiedServer = (req, res) => {
    // Get and parse the URL.
    const parseUrl = url.parse(req.url, true)

    // Determine the request untrimmed path.
    const trimmedPath = parseUrl.pathname.replace(/^\/+|\/+$/g, '')

    // Get the query string as an object.
    const queryStringObject = parseUrl.query

    // Determine the HTTP Method.
    const method = req.method

    // Get the headers as an object.
    const headers = req.headers

    // Get the payload if there is any.
    // Payloads come into the request as streams.
    // So we need to catch it so we know the entire payload.
    const decoder =  new StringDecoder('utf-8')
    var buffer = ''
    
    // When a piece of data is streamed, req object emits
    // the 'data' event, so we can decode the piece of data
    // as utf-8 and add it to the buffer.
    req.on('data', chunk => {
        buffer +=  decoder.write(chunk)
    })

    // The 'data' and 'end' events are always emitted by req,
    // so if no payload is sent, the buffer will be just empty.
    req.on('end', () => {
        buffer += decoder.end()

        // Default handler.
        var chosenHandler = handlers.notFound

        // Choose the handler this request should go to.
        if (typeof(server.router[trimmedPath]) !== 'undefined') {
            chosenHandler = server.router[trimmedPath]
        }

        // Construct the data object to send to the handler.
        const data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer),
        }

        // Route the request to the handler specified in the router.
        chosenHandler(data, (statusCode, payload) => {
            // Use the status code called back by the handler, or default to 200.
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200
    
            // Use the payload called back by the handler, or default to an empty object.
            payload = typeof(payload) == 'object' ? payload : {}

            // Convert the payload to a string.
            const payloadString = JSON.stringify(payload)

            // Return the response.
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(statusCode)
            res.end(payloadString + '\n')

            // Log the request payload.
            console.log('Returning this response: ', statusCode, payloadString)
        })

    })
}

// Define a request router.
server.router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks
}

// Init script.
server.init = () => {
    // Start the HTTP server.
    server.httpServer.listen(config.httpPort, () => {
        console.log('The server is listening on port ' + config.httpPort + ' in ' + config.envName + ' mode')
    })

    // Start the HTTPS server.
    server.httpsServer.listen(config.httpsPort, () => {
        console.log('The server is listening on port ' + config.httpsPort + ' in ' + config.envName + ' mode')
    })
}

// Export the module.
module.exports = server
