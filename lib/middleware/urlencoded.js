const { fromUrlEncoded, HttpError } = require('../utils.js');

const read = module.exports.read = () => {
  return (req, res, next) => {
    req.body = fromUrlEncoded(req.rawBody);
    next();
  }
}

const write = module.exports.write = () => {
  return (req, res, next) => {
    const body = Object.keys(req.body || {}).map((key)=>{
      return `${encodeURIComponent(key)}=${encodeURIComponent(req.body[key])}`;
    }).join('&');
    res
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(body);
  }
}

const error = module.exports.error = () => {
  return (err, req, res, next) => {
    if(!(err instanceof HttpError)) err = new HttpError(err);
    const body = Object.keys(err).map((key)=>{
      return `${encodeURIComponent(key)}=${encodeURIComponent(err[key])}`;
    }).join('&');
    res
      .status(err.code)
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(body);
  }
}
