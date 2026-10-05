import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryResearch } from '../src/api.js';

test('sends the API contract and returns the answer', async (t) => {
  const signal = new AbortController().signal;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/query');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), { question: 'Key findings?' });
    assert.equal(options.signal, signal);
    return Response.json({ question: 'Key findings?', answer: 'Findings [1].' });
  });
  assert.equal(await queryResearch('Key findings?', signal), 'Findings [1].');
});

test('turns offline errors into actionable messages', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(queryResearch('Question'), /Could not reach the research API/);
});

test('handles server failure without displaying internal error details', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ detail: 'Internal details' }, { status: 500 }));
  await assert.rejects(queryResearch('Question'), /HTTP 500/);
});

test('rejects empty and malformed answer payloads', async (t) => {
  for (const body of [{ answer: '' }, { answer: '   ' }, { answer: null }, {}]) {
    const mock = t.mock.method(globalThis, 'fetch', async () => Response.json(body));
    await assert.rejects(queryResearch('Question'), /empty or invalid answer/);
    mock.mock.restore();
  }
  t.mock.method(globalThis, 'fetch', async () => new Response('not json'));
  await assert.rejects(queryResearch('Question'), /unreadable response/);
});

test('preserves aborts for timeout handling', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new DOMException('Aborted', 'AbortError'); });
  await assert.rejects(queryResearch('Question'), { name: 'AbortError' });
});
