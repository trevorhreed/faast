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
      if(!res.body) res.status(204);
      res.send(JSON.stringify(res.body));
    }catch(e){
      res
        .status(500)
        .send(new HttpError(500, 'Internal Server Error', e));
    }
  }
}

const errors = module.exports.errors = (mappings) => {
  let mappingFn;
  if(typeof mappings === 'function') mappingFn = mappings;
  else if(mappings && typeof mappings === 'object') mappingFn = x => mappings[x];
  return (err, req, res, next) => {
    if(!(err instanceof HttpError)){
      const code = err instanceof AppError ? err.code : 500;
      err = new HttpError(err);
      if(mappingFn) err.code = mappingFn(code);
    }
    res
      .status(err.code)
      .set('content-type', 'application/json')
      .send(JSON.stringify(err));
  }
}
