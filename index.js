const proxies = require('./proxies.js');
const { AppError, HttpError } = require('./utils.js');

const faast = module.exports = ({ proxy = 'node' } = {}) => {

  if(typeof proxy !== 'function'){
    const proxyKey = proxy;
    proxy = proxies[proxyKey];
    if(!proxy) throw new Error(`faast: invalid proxy: ${proxyKey}. Available proxies include ${Object.keys(proxies)}`);
  }

  const wares = [];
  const use = (path, fn) => {
    if(!fn){
      fn = path;
      path = '/';
    }
    if(typeof fn !== 'function') throw new Error(`faast: invalid middleware. Must provide a function parameter.`);
    fn.matchRoute = matchRoute.bind(null, path, fn);
    wares.push({ path, fn });
  }

  const serve = (...params) => {
    proxy(...params, (err, { req, res }) => {
      if(err) throw err;
      const getNextWare = NextIteratorFactory(wares, req, res);
      const next = (err)=>{
        process.nextTick(()=>{
          const nextWare = getNextWare(err);
          const code = nextWare.fn.toString();
          if(nextWare){
            req.baseUrl = nextWare.baseUrl;
            if(nextWare.handlesErrors) nextWare.fn(err, req, res, next);
            else nextWare.fn(req, res, next);
          }else{
            throw new Error('faast: Unhandled request. No middleware found.');
          }
        });
      }
      next();
    });
  }

  return {
    use,
    serve
  }
}

module.exports.AppError = AppError;
module.exports.HttpError = HttpError;

const matchRoute = (path, fn, err, requestPath) => {
  requestPath = requestPath || '';
  let baseUrl = '';
  let isPathMatch = false;
  if(path instanceof RegExp){
    const match = path.exec(requestPath);
    isPathMatch = !!match;
    baseUrl = match ? match[0] : '';
  }else{
    isPathMatch = requestPath.startsWith(path);
    baseUrl = isPathMatch ? path : '';
  }
  const handlesErrors = fn.length === 4;
  const isRightKind = (err && handlesErrors) || (!err && !handlesErrors);
  const isMatch = isPathMatch && isRightKind;
  return { baseUrl, handlesErrors, isMatch };
}

const NextIteratorFactory = (wares, req, res) => {
  let i = -1;
  return (err) => {
    let baseUrl = '';
    while(i < wares.length){
      i++;
      if(i === wares.length) return;
      const { path, fn } = wares[i] || {};
      const { baseUrl, handlesErrors, isMatch } = fn.matchRoute(err, req.path);
      if(isMatch) return { fn, baseUrl, handlesErrors }
    }
  }
}


/*

Faast

  faast([proxy: String|Function]) - creates a faast application

    @param proxy {String|Function} - ...
    @returns app {FaastApplication}

  FaastApplication

    Properties:
      ...

    Methods:

      app.use([path: String|RegExp], fn: Function)

        @param path {String|RegExp}
        @param fn {Function}
          - Function: (req, res, next)
          - Function: (err, req, res, next)

  Middleware

    middleware.services(jsonFile: String)

      @param jsonFile {String}

    middleware.services(directory: String) - For development purposes only! Not for production use!

      @param directory {String}

*/
