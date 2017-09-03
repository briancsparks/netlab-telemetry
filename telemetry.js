
/**
 *  This is the boring loader file for the telemetry module.
 *
 *  This is the entry point, but all it does is load other things, so they
 *  can do the real work.
 *
 *    routes/upload   -- Handles uploads.
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;
const serverassist            = sg.include('serverassist') || require('serverassist');

const ARGV                    = sg.ARGV();

const myName                  = 'telemetry.js';
const publicRoutes            = ['routes/upload'];
const xapiRoutes              = [];

const main = function() {
  const routes = ARGV.public? publicRoutes : ARGV.xapi? xapiRoutes : [];

  // My chance to load routes or on-starters
  const addModRoutes = function(addRoute, onStart, db, callback) {
    return callback();
  };

  const addFinalRoutes = function(addRoute, onStart, db, callback) {
    return callback();
  };

  var   params = {
    port        : ARGV.port || 8106,
    routes,
    addModRoutes,
    addFinalRoutes,
    __dirname
  };

  return serverassist.loadHttpServer(myName, params, (err, server, db) => {
    if (err)    { return sg.die(err, 'loading-http-server'); }

    console.log('telemetry up');
  });
};

main();

