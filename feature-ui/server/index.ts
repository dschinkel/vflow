import Koa from 'koa'
import Router from '@koa/router'
import serve from 'koa-static'
import { koaBody } from 'koa-body'
import path from 'path'
import fs from 'fs'
import { parseStoryMap } from './parseStoryMap'
import { openStream, streamToAll } from './boardStream'

export function createApp(mapPath: string): Koa {
  const app = new Koa()
  const router = new Router()
  let activeStickyText: string | null = null

  function state() {
    return { ...parseStoryMap(mapPath), activeStickyText }
  }

  router.get('/events', async (ctx) => {
    ctx.respond = false
    openStream(ctx.res)
    ctx.res.write(`data: ${JSON.stringify(state())}\n\n`)
  })

  router.get('/state', async (ctx) => {
    ctx.body = state()
  })

  router.post('/active-sticky', koaBody(), async (ctx) => {
    activeStickyText = (ctx.request.body as { text?: string | null })?.text ?? null
    streamToAll(state())
    ctx.body = { ok: true }
  })

  if (fs.existsSync(mapPath)) {
    fs.watch(mapPath, () => streamToAll(state()))
  }

  const distPath = path.join(__dirname, '../dist')
  if (fs.existsSync(distPath)) app.use(serve(distPath))

  app.use(router.routes())
  return app
}

const [,, mapPath, portArg] = process.argv
if (mapPath) {
  const port = parseInt(portArg ?? '3847')
  const app = createApp(mapPath)
  app.listen(port, () => console.log(`feature-ui: http://localhost:${port}`))
}
