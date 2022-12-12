const assert = require('assert');
const get = require('lodash.get');
const set = require('lodash.set');
const providers = require('@purest/providers');
const purest = require('purest')({
  request: require('request')
});
const debug = require('./debug');
const Resource = require('./resource');
const apiConfig = require('./api.json');

debug('setup')('Loaded API configs:', Object.entries(apiConfig).length);

function ConstantContact(config = {}) {
  const client = purest({
    provider: 'constantcontact',
    config: providers
  });

  // Set the authentication credentials
  const { apiKey, accessToken } = config;
  assert.ok(apiKey, 'Missing config.apiKey');
  assert.ok(accessToken, 'Missing config.accessToken');

  this.client = () => client.auth(accessToken, apiKey);

  // Create all the API resources
  for (let [path, actions] of Object.entries(apiConfig)) {
    debug('setup')(`Setting up resource for ${path}`);
    const resource = new Resource(this.client, actions);
    set(this, path, resource);
  }

  const follow = (url) => {
    let version = url.match(/^\/(v\d+)\//)[1];
    return Resource.invokeRequest(this.client().get(url.replace(`/${version}/`,'')).options({version: version}));
  };

  this.paginate = (first, handle, reject, finished) => {
    return first
      .catch((err) => {
        debug('pagination')('Caught an error - exiting early');
        if (typeof reject === 'function') reject(err);
        return Promise.reject(err);
      })
      .then((result) => {
        let next = get(result, 'meta.pagination.next_link');
        try {
          return Promise.resolve(handle(result))
            .catch((err) => {
              debug('pagination')('Caught a handling error - exiting early');
              return Promise.reject(err);
            })
            .then(() => {
              if (next) {
                debug('pagination')(`Following pagination link: ${next}`);
                return this.paginate(follow(next), handle, reject, finished);
              } else if (typeof finished === 'function') {
                debug('pagination')('Pagination finished');
                return Promise.resolve(finished());
              }
            });
        } catch (err) {
            debug('pagination')('Caught a handling rejection - exiting early');
            return Promise.reject(err);
        }
      });
  };

  this.bulkWait = (id, interval = 2000) => {
    debug('bulk')(`Polling bulk job ${id}`);

    return new Promise((resolve, reject) => {
      let poll = setInterval(() => {
        function stopPolling() {
          clearInterval(poll);
          debug('bulk')(`Polling ended for bulk job ${id}`);
        }

        this.bulk.activities.get({ id })
          .then((result) => {
            debug('bulk')(`Bulk job ${id}`, result);

            if (result.status === 'COMPLETE') {
              stopPolling();
              resolve(result);
            } else if (result.status === 'ERROR') {
              stopPolling();
              reject(result)
            }
          })
          .catch((error) => {
            stopPolling();
            reject(error);
          })
      }, interval);
    });
  };
}

module.exports = ConstantContact;
