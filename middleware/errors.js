const { HttpError } = require('../utils.js');

module.exports = () => {
  return (err, req, res, next) => {
    let status = err && typeof err === 'object'
      ? err.code || 500
      : 500;
    if(status > 500) status = 500;
    else if(status === 404) status = 403;
    res
      .status(status)
      .set('content-type', 'text/plain')
      .send(`${status} ${HttpError.getStatusText(status)}`);
  }
}
