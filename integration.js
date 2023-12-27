'use strict';

const request = require('postman-request');
const config = require('./config/config');
const async = require('async');
const fs = require('fs');

let Logger;
let requestWithDefaults;

const MAX_PARALLEL_LOOKUPS = 10;

function startup(logger) {
  Logger = logger;

  let requestOptions = {};

  if (typeof config.request.cert === 'string' && config.request.cert.length > 0) {
    requestOptions.cert = fs.readFileSync(config.request.cert);
  }

  if (typeof config.request.key === 'string' && config.request.key.length > 0) {
    requestOptions.key = fs.readFileSync(config.request.key);
  }

  if (typeof config.request.passphrase === 'string' && config.request.passphrase.length > 0) {
    requestOptions.passphrase = config.request.passphrase;
  }

  if (typeof config.request.ca === 'string' && config.request.ca.length > 0) {
    requestOptions.ca = fs.readFileSync(config.request.ca);
  }

  if (typeof config.request.proxy === 'string' && config.request.proxy.length > 0) {
    requestOptions.proxy = config.request.proxy;
  }

  if (typeof config.request.rejectUnauthorized === 'boolean') {
    requestOptions.rejectUnauthorized = config.request.rejectUnauthorized;
  }

  requestWithDefaults = request.defaults(requestOptions);
}

/**
 *
 * @param entities
 * @param options
 * @param cb
 */
function doLookup(entities, options, cb) {
  const lookupResults = [];
  const tasks = [];

  Logger.trace({ entities }, 'doLookup');

  entities.forEach((entity) => {
    const requestOptions = {
      uri: `https://api.echotrail.io/insights/${entity.value}`,
      method: 'GET',
      headers: {
        'x-api-key': options.apiKey
      },
      json: true
    };

    tasks.push(function (done) {
      Logger.debug({ requestOptions: requestOptions }, 'Sending Request');
      requestWithDefaults(requestOptions, function (error, res, body) {
        if (error) {
          Logger.error(error, 'HTTP Request Error');
          return done({
            detail: 'HTTP Request Error',
            error
          });
        }

        Logger.trace({ body: body, status: res ? res.statusCode : 'N/A' }, 'Received Response');

        if (res.statusCode === 200) {
          done(null, {
            entity: entity,
            body: body
          });
        } else if (res.statusCode === 403) {
          done({
            detail: `Invalid API Key`,
            body
          });
        } else if (res.statusCode === 403) {
          done({
            detail: `API Usage Limit Reached - Too many requests`,
            body
          });
        } else {
          done({
            detail: `Unexpected HTTP Status Code Received: ${res.statusCode}`,
            body
          });
        }
      });
    });
  });

  async.parallelLimit(tasks, MAX_PARALLEL_LOOKUPS, (err, results) => {
    if (err) {
      cb({
        detail: err.error,
        ...err
      });
      return;
    }

    results.forEach((result) => {
      if (result.body) {
        lookupResults.push({
          entity: result.entity,
          data: {
            summary: getSummaryTags(result.body, result.entity, options),
            details: result.body
          }
        });
      } else {
        lookupResults.push({
          entity: result.entity,
          data: null
        });
      }
    });

    Logger.debug({ lookupResults }, 'Results');

    cb(null, lookupResults);
  });
}

function getSummaryTags(body, entity, options) {
  const tags = [];

  // If there is a message then we didn't get a result back
  // The message typically says the executable has not been observed
  // Note that the API still returns a 200
  if (body.message) {
    tags.push(`Not observed`);
  } else {
    // string to number conversion required for v4 servers which may not send a numberic value
    if (+options.commonThreshold != -1 && body.eps >= options.commonThreshold && entity.isHash) {
      tags.push({
        text: `EPS: ${body.eps}`,
        icon: 'check',
        classes: ['stripe-bg-green']
      });
    } else if (
      +options.suspiciousThreshold != -1 &&
      body.eps <= options.suspiciousThreshold &&
      entity.isHash
    ) {
      tags.push({
        text: `EPS: ${body.eps}`,
        icon: 'exclamation',
        classes: ['stripe-bg-orange']
      });
    } else {
      tags.push(`EPS: ${body.eps}`);
    }
  }

  return tags;
}

function validateOptions(userOptions, cb) {
  let errors = [];

  if (
    typeof userOptions.apiKey.value !== 'string' ||
    (typeof userOptions.apiKey.value === 'string' && userOptions.apiKey.value.length === 0)
  ) {
    errors.push({
      key: 'apiKey',
      message: 'You must provide an Echotrail API key'
    });
  }

  if (+userOptions.suspiciousThreshold.value < -1 || +userOptions.suspiciousThreshold.value > 100) {
    errors.push({
      key: 'suspiciousThreshold',
      message: `The Anomalous Process Threshold (${userOptions.suspiciousThreshold.value}) must be between -1 and 100`
    });
  }

  if (+userOptions.commonThreshold.value < -1 || +userOptions.commonThreshold.value > 100) {
    errors.push({
      key: 'commonThreshold',
      message: `The Common Process Threshold (${userOptions.commonThreshold.value}) must be between -1 and 100`
    });
  }

  if (+userOptions.suspiciousThreshold.value > +userOptions.commonThreshold.value) {
    errors.push({
      key: 'suspiciousThreshold',
      message: `The Anomalous Process Threshold (${userOptions.suspiciousThreshold.value}) must be less than the Common Process Threshold (${userOptions.commonThreshold.value})`
    });

    errors.push({
      key: 'commonThreshold',
      message: `The Common Process Threshold (${userOptions.commonThreshold.value}) must be greater than the Anomalous Process Threshold (${userOptions.suspiciousThreshold.value})`
    });
  }

  cb(null, errors);
}

module.exports = {
  doLookup,
  startup,
  validateOptions
};
