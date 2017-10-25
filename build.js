const fs = require('fs');
const path = require('path');
const { getFuncArgs } = require('./utils.js');
const fastGlob = require('fast-glob');
const chokidar = require('chokidar');

const ANNOTATION_REGEX = /^ *('|"|`)@endpoint (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) ([^ ]+)( \((.+)\))?\1;? *$/gm;
const GLOB_OPTIONS = { onlyFiles: true, bashNative: [] };
const WATCH_OPTIONS = { ignoreInitial: true };

module.exports = (options = {}) => {
  const { glob, root = process.cwd(), output, watch = false } = options;
  if(!glob || !output) throw new Error(`Invalid parameters to faast.build:\n\n${JSON.stringify(options, null, 2)}\n\n`);

  const cache = {};
  const boundImportFiles = importFiles.bind(null, root);
  const boundExtractEndpoints = extractEndpoints.bind(null, cache);
  const boundWriteRegistry = writeRegistry.bind(null, output);

  const initPromise = fastGlob(glob, GLOB_OPTIONS)
    .then(boundImportFiles)
    .then(boundExtractEndpoints)
    .then(buildRegistry)
    .then(boundWriteRegistry)
    .then(x => !watch && console.log(`Registry built.`))
    .catch(console.error);

  if(!watch) return initPromise;

  const watchUpdate = (filename) => {
    Promise
      .resolve(filename)
      .then(boundImportFiles)
      .then(boundExtractEndpoints)
      .then(buildRegistry)
      .then(boundWriteRegistry)
      .then(x => console.log(`  Change detected in ${filename}...registry rebuilt.`))
      .catch(console.error);
  }

  const watchRemove = (filename) => {
    for(key in cache){
      if(key.startsWith(`${filename}:`)){
        delete cache[key];
        break;
      }
    }
    Promise
      .resolve(cache)
      .then(buildRegistry)
      .then(boundWriteRegistry)
      .catch(console.error);
  }

  initPromise.then(()=>{
    console.log(`Registry built. Watching files...`);
    chokidar.watch(glob, WATCH_OPTIONS)
      .on('add', watchUpdate)
      .on('change', watchUpdate)
      .on('unlink', watchRemove)
      .on('error', console.error);
  }).catch(console.error);

}

module.exports.getRegistryFromGlob = (glob, root = process.cwd()) => {
  const boundImportFiles = importFiles.bind(null, root);
  return fastGlob(glob, GLOB_OPTIONS)
    .then(boundImportFiles)
    .then(extractEndpoints)
    .then(buildRegistry);
}

const importFiles = (root, filenames) => {
  if(!Array.isArray(filenames)) filenames = [filenames];
  return filenames.map((filename)=>{
    const relative = path.relative(root, filename);
    const absolute = path.resolve(relative);
    delete require.cache[require.resolve(absolute)];
    return {
      filename: relative,
      module: require(absolute)
    }
  })
}

const extractEndpoints = (...params) => {
  const endpoints = params.length === 2 ? params[0] : {};
  const services = (params.length === 2 ? params[1] : params[0]) || [];
  services.forEach((service)=>{
    Object.keys(service.module).forEach((name)=>{
      const handler = service.module[name];
      const code = handler.toString();
      let match;
      while(match = ANNOTATION_REGEX.exec(code)){
        const filename = service.filename;
        const key = `${filename}:${name}`;
        const [,,method,url,,args] = match;
        const {regex, params} = parsePath(url);
        const prefix = getPrefix(url, ':?');
        endpoints[key] = {
          key, filename,
          handler,
          name, method, url, prefix, regex,
          urlParamKeys: params,
          fnArgKeys: args ? args.split(/, /g) : getFuncArgs(handler)
        };
      }
    });
  });
  return endpoints;
}

const buildRegistry = (endpoints) => {
  const registry = {};
  Object.keys(endpoints).forEach((key)=>{
    const ep = endpoints[key];
    let method = registry[ep.method];
    if(!method){
      method = [];
      registry[ep.method] = method;
    }
    const index = method.findIndex(x => x.key === ep.key);
    if(index > -1) method.splice(index, 1);
    method.push(ep);
  });
  return registry;
}

const writeRegistry = (output, registry) => {
  return new Promise((resolve, reject)=>{
    const data = JSON.stringify(registry, null, 2);
    fs.writeFile(output, data, (err)=>{
      if(err) return reject(err);
      resolve();
    });
  });
}

const getPrefix = (str, chars) => {
  for(let i=0; i < str.length; i++){
    for(let j=0; j < chars.length; j++){
      if(str[i] === chars[j]) return str.substring(0, i);
    }
  }
  return str;
}

const escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePath = (url) => {
  const params = [];
  const regex = (''+url)
    .split('?')[0]
    .split(/\//)
    .map((section)=>{
      section = section || '';
      if(section.indexOf(':') !== -1){
        const [fixed, variable] = section.split(':');
        params.push(variable);
        return `${escapeRegExp(fixed)}([^\\/]+)`;
      }else{
        return escapeRegExp(section);
      }
    })
    .join('\\/');
  return {
    regex: `^${regex}(\\?.*)?$`,
    params
  }
}
