const cookies = module.exports = (config) => {
  return (req, res, next) => {
    req.cookies = {};
    header = req.headers['cookie'];
    if(!header) return;
    header.split(/[;\s]+/).filter(Boolean).forEach((pair)=>{
      const [key, value] = pair.split('=');
      req.cookies[key] = decodeURIComponent(value);
    });
    next();
  }
}
