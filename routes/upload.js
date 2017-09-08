
/**
 *  This file has the handlers for telemetry uploaders.
 */
const sg                      = require('sgsg');
const _                       = sg._;
const serverassist            = sg.include('serverassist') || require('serverassist');
const AWS                     = require('aws-sdk');

const setOnn                  = sg.setOnn;
const verbose                 = sg.verbose;
const registerAsService       = serverassist.registerAsService;
const registerAsServiceApp    = serverassist.registerAsServiceApp;
const configuration           = serverassist.configuration;
const extractClientId         = serverassist.extractClientId;
const extractPartnerId        = serverassist.extractPartnerId;

const appId                   = 'sa_telemetry';
const mount                   = 'sa/api/v1/telemetry/';
const projectId               = 'sa';

const appRecord = {
  projectId,
  mount,
  appId,
  route               : '/:project(sa)/api/v:version/telemetry/',
  isAdminApp          : false,
  useHttp             : true,
  useHttps            : true,
  requireClientCerts  : false
};

var lib = {};

lib.addRoutes = function(addRoute, onStart, db, callback) {
  var   r;
  const s3 = new AWS.S3();

  /**
   *  /upload handler
   */
  const uploadJson = function(req, res, params, splats, query) {
    var   result        = {};
    const all           = sg.extend(req.bodyJson || {}, params || {}, query || {});
    //const origAllStr    = JSON.stringify(all);
    const sessionId     = sg.extract(all, 'sessionId');

    if (!sessionId)     { return serverassist._400(req, res, 'ENOSESSIONID'); }

    //const origAll       = JSON.parse(origAllStr);

    const clientId      = extractClientId(all);
    const partnerId     = extractPartnerId(all);

    const payloadStats  = evaluatePayload(all)      || {};
    const minTime       = payloadStats.earliest     || _.now();

    // New sessionIds start with the clientId (which is better), but old ones do not
    var   key           = `${sessionId}-${minTime}`;

    if (!sessionId.startsWith(clientId)) {
      key = `${clientId}/${key}`;
    }

    // Prepend with the first 3 chars, so S3 can ingest quickly
    key = `${key.substr(0, 3)}/${key}`;

    const uploadData  = sg.extend(all, {sessionId}, {clientId}, {partnerId});

    var params = {
      Body:         JSON.stringify(uploadData),
      Bucket:       bucketName(),
      Key:          key,
      ContentType:  'application/json'
    };

    return s3.putObject(params, (err, data) => {
      console.log(`added ${payloadStats.numItems} to S3:`, err, data);

      return serverassist._200(req, res, result);
    });
  };

  return sg.__run([function(next) {
    registerAsServiceApp(appId, mount, appRecord, next);

  }, function(next) {
    return configuration({}, {}, (err, r_) => {
      if (err) { return sg.die(err, callback, 'addRoutesToServers.configuration'); }

      r = r_;
      return next();
    });

  }, function(next) {

    addRoute(`/${mount}`, '/upload',    uploadJson);
    addRoute(`/${mount}`, '/upload/*',  uploadJson);

    return next();

  }], function() {
    return callback();
  });
};

lib.earliest = earliest;

_.each(lib, (value, key) => {
  exports[key] = value;
});

/**
 *  Determines various things about a telemetry payload.
 */
function evaluatePayload(data) {
  //console.log(data);
  var result = {numItems:0};

  var earliest = Number.MAX_SAFE_INTEGER;

  earliest = sg.reduce(data, earliest, (m, bucket) => {
    result.numItems++;
    return Math.min(m, bucket.startTime || Number.MAX_SAFE_INTEGER);
  });

  if (earliest === Number.MAX_SAFE_INTEGER) {
    earliest = null;
  }
  result.earliest = earliest;

  return result;
}

/**
 *  Finds the earliest time in the dataset.
 */
function earliest(data) {
  return (evaluatePayload(data) || {}).earliest || null;
};

function bucketName() {
  if (sg.isProduction()) {
    return 'sa-telemetry-netlab-asis-prod';
  }

  return 'sa-telemetry-netlab-asis-test';
}

//    minTime = Math.min(minTime, all.startTime || Number.MAX_SAFE_INTEGER);
//    _.each(all, bucket => {
//      if (!sg.isObject(bucket)) { return; }
//      minTime = Math.min(minTime, bucket.startTime || Number.MAX_SAFE_INTEGER, bucket.tick || Number.MAX_SAFE_INTEGER);
//      if (!('startTime' in bucket) && _.isArray(bucket.items)) {
//        minTime = sg.reduce(bucket.items, minTime, (m, item) => {
//          return Math.min(m, item.eventTime || item.startTime || item.tick || Number.MAX_SAFE_INTEGER);
//        });
//      }
//    });


