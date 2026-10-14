import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAdsRuntimeStore, ADS_REFRESH_MS, type AdsRuntime } from '../src/lib/adsRuntimeStore';

const settled = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const off: AdsRuntime = { adsRuntimeEnabled: false, adUnits: [] };

test('all placements share one lookup; disabled ads never poll, including remounts', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  const store = createAdsRuntimeStore(async () => { calls++; return off; });
  const unsubscribe = Array.from({ length: 10 }, () => store.subscribe(() => {}));
  await settled(); assert.equal(calls, 1);
  t.mock.timers.tick(ADS_REFRESH_MS * 100); await settled(); assert.equal(calls, 1);
  unsubscribe.forEach(fn => fn());
  const stop = store.subscribe(() => {}); await settled();
  assert.equal(calls, 1); assert.equal(store.getSnapshot()?.adsRuntimeEnabled, false); stop();
});

test('enabled placements share one timer; switching off stops all subsequent polling', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0, enabled = true;
  const store = createAdsRuntimeStore(async () => { calls++; return { adsRuntimeEnabled: enabled, adUnits: [] }; });
  const a = store.subscribe(() => {}), b = store.subscribe(() => {});
  await settled(); assert.equal(calls, 1);
  t.mock.timers.tick(ADS_REFRESH_MS); await settled(); assert.equal(calls, 2);
  enabled = false;
  t.mock.timers.tick(ADS_REFRESH_MS); await settled(); assert.equal(calls, 3);
  t.mock.timers.tick(ADS_REFRESH_MS * 100); await settled(); assert.equal(calls, 3);
  a(); b();
});

test('late network responses cannot undo an admin OFF update; failures remain off', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let resolve!: (value: AdsRuntime) => void;
  const store = createAdsRuntimeStore(() => new Promise(done => { resolve = done; }));
  const stop = store.subscribe(() => {});
  store.update(off); resolve({ adsRuntimeEnabled: true, adUnits: [] }); await settled();
  assert.equal(store.getSnapshot()?.adsRuntimeEnabled, false); stop();
  let calls = 0;
  const failed = createAdsRuntimeStore(async () => { calls++; throw new Error('offline'); });
  const end = failed.subscribe(() => {}); await settled();
  t.mock.timers.tick(ADS_REFRESH_MS * 100); await settled();
  assert.equal(calls, 1); assert.equal(failed.getSnapshot()?.adsRuntimeEnabled, false); end();
});

test('admin updates enable cached-off placements; no listeners or hidden pages make no requests', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0, visible = false;
  const store = createAdsRuntimeStore(async () => { calls++; return off; }, () => visible);
  const stop = store.subscribe(() => {}); await settled();
  store.update({ adsRuntimeEnabled: true, adUnits: [] });
  t.mock.timers.tick(ADS_REFRESH_MS); await settled(); assert.equal(calls, 1);
  visible = true;
  t.mock.timers.tick(ADS_REFRESH_MS); await settled(); assert.equal(calls, 2);
  store.update({ adsRuntimeEnabled: true, adUnits: [] }); stop();
  t.mock.timers.tick(ADS_REFRESH_MS * 100); await settled(); assert.equal(calls, 2);
});
