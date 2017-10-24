> NOTE: This project is in a pre-release state; this documentation is incomplete.

# Faast

> A fast FaaS web framework

Faast is a very light weight framework designed specifically for FaaS (function-as-a-service) environments. It is optimized for quick cold starts. Primarily, it does this by loading endpoints as needed.

## Install/Setup

Faast is an `npm` module, so you probably already know how to install it:

```bash
> npm i faast
```

## Quickstart

Faast was inspired by ExpressJS, and some effort was made to follow API conventions from that project. Here is a simple example Faast application:

```javascript
const http = require('http');
const faast = require('faast');
const services = require('faast/middleware/services');

const app = faast();

app.use(services('registry.json'));
app.use(json.write());

const PORT = 3000;
http.createServer(app.serve).listen(PORT, ()=>{
  console.log(`Now listening on port ${PORT}...`);
});
```

The registry JSON file referenced in the code above is a pre-compiled registry of your web application's endpoints. The 'services' middleware is at the core of Faast's optimization. It uses the registry file to find and load endpoints when needed. Because this requires a build step (see here<TODO> for how to build a registry file), Faast provides a prototyping option that runs the build step dynamically for each request. Here is an example of that options:

```javascript
const http = require('http');
const faast = require('faast');
const services = require('faast/middleware/services');
const json = require('faast/middleware/json');

const app = faast();

app.use(services('./endpoints/**/*.js'));
app.use(json.write());

const PORT = 3000;
http.createServer(app.serve).listen(PORT, ()=>{
  console.log(`Now listening on port ${PORT}...`);
});
```

Notice that the only change here is that instead of passing a JSON registry file to the services middleware, we are now passing a glob that points to all javascript files in a particular directory.


## Proxies

Proxies allow you to convert input from the environment to a standardized request/response format that Faast applications recognize. By default, Faast uses the built-in `node` proxy. This proxies the standard request and response objects provided by the node `http` library to Faast request and response objects (see here<TODO> for the API specs of these objects). There is also a built-in proxy for AWS. You can use this proxy by passing in the string 'aws' to the Faast function like so: `const app = faast('aws')`. You can also pass in your own custom function that proxies from whatever input you want.

### Writing your own proxy function

...TODO...

## Building a registry file

...TODO...

## Other middleware

### Static Files

### JSON

### URL-encoded

### Errors

### Auth

### Cookies

## Writing middleware

...TODO...
