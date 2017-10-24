const { fromJson, HttpError } = require('../utils.js');

const read = module.exports.read = () => {
  return (req, res, next) => {
    req.body = fromJson(req.rawBody);
    next();
  }
}

const write = module.exports.write = () => {
  return (req, res, next) => {
    res.set('content-type', 'application/json');
    try{
      res.send(JSON.stringify(res.body));
    }catch(e){
      res
        .status(500)
        .send(new HttpError(500, 'Internal Server Error', e));
    }
  }
}

const errors = module.exports.errors = () => {
  return (err, req, res, next) => {
    if(!(err instanceof HttpError)) err = new HttpError(err);
    res
      .status(err.code)
      .set('content-type', 'application/json')
      .send(JSON.stringify(err));
  }
}
