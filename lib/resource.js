const assemble = require('url-assembler');
const createError = require('http-errors');
const dotProp = require('dot-prop');
const debug = require('./debug');
const RateLimiter = require('request-rate-limiter');

let limiter;

function Resource(clientFactory, actions) {
  for (let [action, config] of Object.entries(actions)) {
    debug('setup')(`Building resource action ${action}`);

    this[action] = (params, qs = {}) => {
      const client = clientFactory();

      debug('resource')(`Called ${action}`);

      const method = config.method.toLowerCase();
      let url = assemble().template(config.url);
      let req;

      if (method === 'get') {
        url = url.param(params).toString();
        debug('resource')(`HTTP ${config.method} ${url}`);
        req = client[method](url);
      } else {
        url = url.param(params, true).query(qs).toString();
        debug('resource')(`HTTP ${config.method} ${url}`);
        debug('resource')('body:', params);
        req = client[method](url).body(params);
      }

      return this.invokeRequest(req);
    };
  }
}

Resource.setRateLimit = (rate = 4, period = 1) => {
    limiter = new RateLimiter({rate: rate, period: period});
};

Resource.invokeRequest = Resource.prototype.invokeRequest = (req) => {
  return new Promise((resolve, reject) => {
    // queue request
    debug('resource')('Request: Queued');
    limiter.request().then(function(backoff) {
      // its time to execute your request
      debug('resource')('Request: Fired');
      req.request((err, res, body) => {
        if (err) {
          if (res) {
              debug('resource')(`Error: HTTP ${res.statusCode}`);
              if (res.statusCode === 429) {
                  // we have to back off. this callback will be called again as soon as the remote enpoint
                  // should accept requests again. no need to queue your callback another time on the limiter.
                  debug('resource')(`Rate Exceeded: Backing off and trying again`);
                  backoff();
              } else {
                  // request failed
                  reject(createError(res.statusCode, body[0].error_message, { body }));
              }
          } else {
            reject(err);
          }
        } else {
          debug('resource')(`Response: HTTP ${res.statusCode}`);
          resolve(body);
        }
      });
    }).catch(function(err) {
      // the err object is set if the limiter is overflowing or is not able to execute your request in time
      debug('resource')('Error: Rate Limiter');
      console.error(err);
    });
  });
};

Resource.setRateLimit();
module.exports = Resource;
