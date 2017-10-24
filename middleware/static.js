const fs = require('fs');
const path = require('path');
const { HttpError } = require('../utils.js');

module.exports = (src, options = {}) => {
  const indexFile = options.indexFile || 'index.html';
  const mimes = options.mimes || {
    '.html': 'text/html',
    '.css': 'text/css',
    '.json': 'application/json',
    '.js': 'application/javascript'
  };
  return (req, res, next) => {
    let filename = req.path;
    if(filename.endsWith('/')) filename += indexFile;
    filename = filename.substr(req.baseUrl.length);
    filename = path.join(src, filename);
    fs.readFile(filename, (err, data)=>{
      if(err) return next();//next(new HttpError(404, 'File not found.', err));
      const ext = path.extname(filename);
      res
        .status(200)
        .set('content-type', mimes[ext])
        .send(data.toString());
    });
  }
}

let html = (strings, ...values) => {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) result += values[i];
  }
  return result;
};


module.exports.errors = () => {
  return (err, req, res, next) => {
    if(!(err instanceof HttpError)) err = new HttpError(err);
    res
      .status(err.code)
      .set('content-type', 'text/html')
      .send(html`
        <!doctype html>
        <html>
          <head>
            <title>${err.code} - ${err.message}</title>
            <style>
              pre{
                padding:10px 20px;
                background:#eee;
              }
            </style>
          </head>
          <body>
            <h1>${err.code} - ${err.message}</h1>
            <p>${err.type}  - ${err.name}</p>
            <pre>${JSON.stringify(err, null, 2)}</pre>
          </body>
        </html>
      `);
  }
}
