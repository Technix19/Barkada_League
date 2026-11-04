// Read-only smoke test. Run against a staged API after the database migration.
// Usage: BARKADA_API_URL=https://staging-api.example.com node server/scripts/smoke.mjs
// Never uses an authorization token or writes to the database.
import assert from 'node:assert/strict'

const base = (process.env.BARKADA_API_URL || '').replace(/\/+$/, '')
if (!/^https?:\/\//.test(base)) {
  console.error('Set BARKADA_API_URL to the base URL of the Express backend.')
  process.exit(2)
}
let failures = 0
async function check(label, path, verify) {
  try {
    const response = await fetch(base + '/api' + path, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12000) })
    const body = await response.json().catch(() => null)
    assert.equal(response.status, 200, 'Unexpected HTTP status ' + response.status)
    verify(body)
    console.log('PASS', label)
    return body
  } catch (error) {
    console.error('FAIL', label + ':', error.message)
    failures += 1
    return null
  }
}

const health = await check('database health', '/health', body => {
  assert.equal(body?.status, 'ok')
  assert.equal(body?.database, 'connected')
})
const demo = await check('public demo discovery', '/leagues/demo', body => {
  assert.ok(Number.isSafeInteger(body?.id) && body.id > 0)
  assert.equal(body?.slug, 'barkada-demo')
  assert.equal(body?.isPublic, true)
})
if (health && demo) {
  const id = demo.id
  const league = await check('public league read', '/leagues/' + id, body => {
    assert.equal(body?.id, id)
    assert.equal(body?.isPublic, true)
  })
  const [players, seasons] = await Promise.all([
    check('public demo players', '/leagues/' + id + '/players', body => {
      assert.ok(Array.isArray(body))
      assert.ok(body.length >= 6)
    }),
    check('public demo seasons', '/leagues/' + id + '/seasons', body => {
      assert.ok(Array.isArray(body))
      assert.ok(body.length >= 1)
    }),
  ])
  if (league && players && seasons?.length) {
    const seasonId = (seasons.find(s => s.isActive) || seasons[0]).id
    await Promise.all([
      check('leaderboard', '/leagues/' + id + '/leaderboard?seasonId=' + seasonId, body => {
        assert.ok(Array.isArray(body))
        assert.ok(body.length >= 6)
        assert.ok(body.every(x => x.player?.id && Number.isFinite(x.wins)))
      }),
      check('match history', '/leagues/' + id + '/matches?seasonId=' + seasonId + '&limit=25&offset=0', body => {
        assert.ok(Array.isArray(body))
        assert.ok(body.length >= 15)
        assert.ok(body.every(x => x.player1?.id && x.player2?.id && x.winner?.id))
      }),
    ])
  }
}
if (failures) {
  console.error(failures + ' checks failed. No data was written.')
  process.exit(1)
}
console.log('All read-only smoke checks passed. No data was written.')
