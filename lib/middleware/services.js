const path = require('path')
const { fromUrlEncoded, fromJson, HttpError } = require('../utils.js')

module.exports = (input, root = process.cwd()) => {
  const isRouteMatch = (req, route) => {
    const matches = req.url.match(route.regex)
    if (!matches) return false
    req.params = {}
    matches.shift()
    for (let i = 0; i < matches.length && i < route.urlParamKeys.length; i++) {
      if (!route.urlParamKeys[i]) continue
      req.params[route.urlParamKeys[i]] = matches[i]
    }
    return true
  }
  const getRoute = (registry, req) => {
    const route = (registry[req.method] || []).find(route => {
      if (!(route.regex instanceof RegExp)) {
        route.regex = new RegExp(route.regex)
      }
      return isRouteMatch(req, route)
    })
    if (!route) return
    if (!route.handler) {
      const absolute = path.join(root, route.filename)
      route.handler = require(absolute)[route.name]
    }
    const args = route.fnArgKeys.map(arg => {
      switch (arg) {
        case '$req':
          return req
        case '$res':
          return res
        case '$json':
          return fromJson(req.rawBody)
        case '$urlencoded':
          return fromUrlEncoded(req.rawBody)
        case '$raw':
          return req.rawBody
        default:
          return req.params[arg] || req.query[arg] || req.headers[arg.toLowerCase()] || (req.cookies || {})[arg]
      }
    })
    return { route, args }
  }
  const respond = (res, next, data) => {
    res.body = data
    next()
  }
  if (input.endsWith('.json')) {
    if (input[0] !== '/') input = path.join(root, input)
    const registry = require(input)
    return (req, res, next) => {
      const { route, args } = getRoute(registry, req) || {}
      if (!route) return next() //next(new HttpError(404, 'Endpoint not found.'));
      Promise.resolve()
        .then(x => route.handler(...args))
        .then(respond.bind(null, res, next))
        .catch(next)
    }
  }
  /*
   *  This function is provided as a convenience for development.
   *  You can pass a glob into the services middleware function and it
   *  will serve up a directory of service modules, parsing them on the
   *  fly. This, obviously, has performance issues and is not intended
   *  for production use. You should use the faast/build module to
   *  compile a directory of service modules into a JSON registry file
   *  and pass the name of that file into the services middleware for
   *  production use.
   */
  return (req, res, next) => {
    console.log(`Warning: passing a directory into middleware.services(...) is not for production use!`)
    require('../build.js')
      .getRegistryFromGlob(input)
      .then(registry => {
        const { route, args } = getRoute(registry, req) || {}
        if (!route) return next() //next(new HttpError(404, 'Endpoint not found.'));
        return Promise.resolve(route.handler(...args))
          .then(respond.bind(null, res, next))
          .catch(next)
      })
      .catch(next)
  }
}
