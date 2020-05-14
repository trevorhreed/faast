const { normalizeHeaders } = require('../utils.js')

module.exports = (event, context, callback, start) => {
  const responseObject = {
    sent: false,
    statusCode: 200,
    headers: {},
    body: null,
    status(statusCode) {
      this.statusCode = statusCode
      return this
    },
    set(key, value) {
      key = ('' + key).toLowerCase()
      this.headers[key] = value
      return this
    },
    send(data) {
      callback(null, {
        statusCode: this.statusCode,
        headers: this.headers,
        body: data || this.body || ''
      })
      this.sent = true
    }
  }
  const headers = normalizeHeaders(event.headers)
  const method = ('' + event.httpMethod).toUpperCase()
  const path = event.path
  const query = event.queryStringParameters || {}
  const url = `${event.path}?${Object.keys(query).map(k => `${k}=${query[k]}`)}`
  const rawBody = event.body
  const requestObject = { headers, method, url, path, query, rawBody }
  start(null, {
    req: requestObject,
    res: responseObject
  })
}
