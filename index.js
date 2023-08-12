/*
 * Primary file for the API.
 */

// Dependencies
const http = require('http')
const https = require('https')
const url = require('url')
const StringDecoder = require('string_decoder').StringDecoder
const config = require('./config')
const fs = require('fs')

// Instantiate the HTTP server.
const httpServer = http.createServer((req, res) => {
    unifiedServer(req, res)
})

// Start the HTTP server.
httpServer.listen(config.httpPort, () => {
    console.log('The server is listening on port ' + config.httpPort + ' in ' + config.envName + ' mode')
})

// Instantiate the HTTPS server.
const httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
}
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
    unifiedServer(req, res)
})

// Start the HTTPS server.
httpsServer.listen(config.httpsPort, () => {
    console.log('The server is listening on port ' + config.httpsPort + ' in ' + config.envName + ' mode')
})

// All the server logic for both the http and https server.
const unifiedServer = (req, res) => {
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
    // so if no payload is sent, the buffer will be empty.
    req.on('end', () => {
        buffer += decoder.end()

        // Default handler.
        var chosenHandler = handlers.notFound

        // Choose the handler this request should go to.
        if (typeof(router[trimmedPath]) !== 'undefined') {
            chosenHandler = router[trimmedPath]
        }

        // Construct the data object to send to the handler.
        const data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': buffer
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

// Define the handlers.
const handlers = {}

// Ping handler.
handlers.ping = (data, callback) => {
    // Callback a http status code and a payload optionally.
    callback(200)
}

// Not found handler.
handlers.notFound = (data, callback) => {
    callback(404)
}

// Define a request router.
const router = {
    'ping': handlers.ping
}
