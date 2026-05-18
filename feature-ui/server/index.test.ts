import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import request from 'supertest'
import { createApp } from './index'
import { clearClients } from './boardStream'

let tmpDir: string
let mapPath: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'feature-ui-'))
  mapPath = path.join(tmpDir, 'story-map.md')
  fs.writeFileSync(mapPath, '# Payments Flow\n\n> As a buyer, I want to pay.\n\n## Checkout\n- [ ] Proceed to checkout\n')
  clearClients()
})
afterEach(() => { fs.rmSync(tmpDir, { recursive: true }) })

describe('GET /state', () => {
  it('returns the parsed story map as JSON', async () => {
    const app = createApp(mapPath)
    const res = await request(app.callback()).get('/state')
    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Payments Flow')
    expect(res.body.valueStory).toBe('As a buyer, I want to pay.')
    expect(res.body.activeStickyText).toBeNull()
    expect(res.body.activities[0].name).toBe('Checkout')
  })
})

describe('POST /active-sticky', () => {
  it('sets the active sticky text and confirms', async () => {
    const app = createApp(mapPath)
    const res = await request(app.callback())
      .post('/active-sticky')
      .send({ text: 'Proceed to checkout' })
      .set('Content-Type', 'application/json')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('includes the active sticky in subsequent state responses', async () => {
    const app = createApp(mapPath)
    await request(app.callback())
      .post('/active-sticky')
      .send({ text: 'Proceed to checkout' })
      .set('Content-Type', 'application/json')
    const stateRes = await request(app.callback()).get('/state')
    expect(stateRes.body.activeStickyText).toBe('Proceed to checkout')
  })

  it('clears the active sticky when text is null', async () => {
    const app = createApp(mapPath)
    await request(app.callback())
      .post('/active-sticky')
      .send({ text: 'Proceed to checkout' })
      .set('Content-Type', 'application/json')
    await request(app.callback())
      .post('/active-sticky')
      .send({ text: null })
      .set('Content-Type', 'application/json')
    const stateRes = await request(app.callback()).get('/state')
    expect(stateRes.body.activeStickyText).toBeNull()
  })
})
