const { HttpError, fromUrlEncoded } = require('../utils.js')

module.exports = (req, res, start) => {
  const responseObject = {
    sent: false,
    statusCode: 200,
    headers: {},
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
      body = data === undefined ? '' : '' + data
      res.writeHead(this.statusCode || 501, this.headers)
      res.end(body)
      this.sent = true
    }
  }
  const headers = req.headers
  const method = req.method
  let [path, query = ''] = req.url.split('?')
  query = fromUrlEncoded(query)
  const url = req.url
  let data = []
  req.on('data', chunk => data.push(chunk))
  req.on('error', err => {
    start(new HttpError(500, 'Unable to parse request.', err))
  })
  req.on('end', () => {
    const rawBody = Buffer.concat(data).toString()
    const requsetObject = { headers, method, url, path, query, rawBody }
    start(null, {
      req: requsetObject,
      res: responseObject
    })
  })
}
