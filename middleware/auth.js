const jwt = require('jsonwebtoken');

const auth = module.exports = ({ secret, audience, issuer, authTokenKey = 'auth_token' } = {}) => {
  return (req, res, next) => {
    let token = null;
    if(req.headers['authorization']){
      let str = req.headers['authorization'];
      if(str.startsWith('Bearer ')) token = str.substr(7);
      else token = str;
    }else if(req.cookies && req.cookies['auth_token']){
      token = req.cookies['auth_token'];
    }else if(req.query['auth_token']){
      token = req.query['auth_token'];
    }
    if(token){
      req.auth = jwt.verify(token, secret, {
        audience,
        issuer,
      });
    }
  }
}
