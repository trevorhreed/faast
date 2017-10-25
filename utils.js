const getFuncArgs = module.exports.getFuncArgs = (fn) => {
  const str = fn.toString();
  let start = str.indexOf('(') + 1;
  let end = str.indexOf(')');
  if(start > 0){
    return str.substring(start, end).split(/[,\s]+/).filter(Boolean);
  }else{
    end = str.indexOf('=>');
    return [str.substring(0, end).trim()];
  }
}

const fromJson = module.exports.fromJson = (str) => {
  try{
    return JSON.parse(str);
  }catch(e){
    return {};
  }
}

const fromUrlEncoded = module.exports.fromUrlEncoded = (urlencoded) => {
  const result = {};
  (('' + urlencoded).split('&') || []).map((pair)=>{
    const [key, value] = ('' + pair).split('=');
    if(result[key]){
      if(!Array.isArray(result[key])){
        result[key] = [result[key]];
      }
      result[key].push(value);
    }else{
      result[key] = value === void 0 ? true : value;
    }
  });
  return result;
}

const normalizeHeaders = module.exports.normalizeHeaders = (headers) => {
  let newHeaders = {};
  if(headers && typeof headers === 'object'){
    Object.keys(headers).forEach(key => newHeaders[('' + key).toLowerCase()] = headers[key]);
  }
  if(!newHeaders['content-type']) newHeaders['content-type'] = 'application/json';
  return newHeaders;
}

const getStack = (e) => {
  if(e && typeof e === 'object' && e.stack){
    let stack = e.stack;
    if(typeof stack === 'string'){
      stack = stack
        .split('\n')
        .slice(1)
        .map(x => x.trim());
    }
    return stack;
  }else{
    return new Error()
      .stack
      .split('\n')
      .map(x => x.trim())
      .slice(3);
  }
  return stack;
}

const AppError = module.exports.AppError = function(...params){
  if(params[0] instanceof AppError) return params[0];
  this.code = 0;
  this.name = 'AppError';
  if(params[0] instanceof Error){ // (err[, inner])
    this.name = params[0].name;
    this.message = params[0].message;
    this.stack = getStack(params[0]);
    this.inner = params[1];
  }else if(typeof params[0] === 'number'){ // (code[, message[, detail]])
    this.code = params[0];
    this.message = params[1];
    this.detail = params[2];
    this.stack = getStack();
  }else if(typeof params[0] === 'string'){ // (message[, detail])
    this.message = params[0];
    this.detail = params[1];
    this.stack = getStack();
  }else{
    this.message = params[0];
    this.detail = params;
    this.stack = getStack();
  }
}

const HTTP_STATUS_MESSAGES = {
  200: 'OK',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  503: 'Service Unavailable'
}

const HttpError = module.exports.HttpError = function(...params){
  if(params[0] instanceof HttpError) return params[0];
  if(params[0] instanceof Error || params[0] instanceof AppError){ // (err[, inner])
    this.code = 500;
    this.type = HTTP_STATUS_MESSAGES[this.code] || 'Unknown Http Status';
    this.name = params[0].name;
    this.message = params[0].message || 'Unknown Error';
    this.stack = getStack(params[0]);
    this.inner = params[1];
  }else if(typeof params[0] === 'number'){ // (code[, message[, detail/inner[, inner]]])
    this.code = params[0];
    this.type = HTTP_STATUS_MESSAGES[this.code] || 'Unknown Http Status';
    this.name = 'HttpError';
    this.message = params[1] || 'Unknown Error';
    this.stack = getStack();
    if(params[2] instanceof Error || params[2] instanceof AppError){
      this.inner = params[2];
    }else if(params[2]){
      this.detail = params[2];
      if(params[3]){
        this.inner = params[3];
      }
    }
  }else{
    this.code = 500;
    this.type = HTTP_STATUS_MESSAGES[this.code];
    this.name = 'HttpError';
    this.message = params[0];
    this.stack = getStack();
    this.detail = params;
  }
  if(this.inner instanceof Error){
    this.inner = {
      name: this.inner.name,
      message: this.inner.message,
      stack: getStack(this.inner)
    }
  }
}

HttpError.getStatusText = (status) => {
  return HTTP_STATUS_MESSAGES[status] || 500;
}
