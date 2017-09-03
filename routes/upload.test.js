
import test from 'ava';

const _                       = require('underscore');
const upload                  = require('./upload');
const earliest                = upload.earliest;

const telemetry0 = {
  counters: {
    startTime : 155
  },
  printerScan: {
    startTime : 55
  }
};

test('Knows bucket startTime', t => {
  t.is(earliest(telemetry0), 55);
});

test('Handles non-object bucket', t => {
  const telemetry0_2 = _.extend({}, telemetry0, {foo:'bar'});
  t.is(earliest(telemetry0_2), 55);
});

test('Handles missing bucket startTime', t => {
  const telemetry0_2 = _.extend({}, telemetry0, {foo:{}});
  t.is(earliest(telemetry0_2), 55);
});

test('Returns null if no time is found', t => {
  t.is(earliest({}), null);
});

