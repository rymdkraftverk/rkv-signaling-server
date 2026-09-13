import { assertEquals, assertMatch, assertRejects } from '@std/assert'
import { stub } from '@std/testing/mock'
import { FakeTime } from '@std/testing/time'
import { createGameCodes } from '../src/gameCode.ts'

const DAY_MS = 24 * 60 * 60 * 1000

// Pins every candidate to the same code, so claiming and freeing are observable
const alwaysTheSameCode = () => {
  const random = stub(Math, 'random', () => 0)
  return { code: 'AAAA', [Symbol.dispose]: () => random.restore() }
}

Deno.test('codes are four letters from the unambiguous alphabet', async () => {
  const { create } = createGameCodes()

  assertMatch(await create(), /^[A-FHJ-Z]{4}$/)
})

Deno.test('never hands out a code twice', async () => {
  const { create } = createGameCodes()
  const codes = await Promise.all(Array.from({ length: 200 }, create))

  assertEquals(new Set(codes).size, codes.length)
})

Deno.test('gives up rather than looping forever when codes run out', async () => {
  const { create } = createGameCodes()
  using _pinned = alwaysTheSameCode()

  await create()

  await assertRejects(() => create(), Error, 'unique code')
})

Deno.test('frees a code once it is deleted', async () => {
  const { create, delete: remove } = createGameCodes()
  using pinned = alwaysTheSameCode()

  assertEquals(await create(), pinned.code)
  await remove(pinned.code)

  assertEquals(await create(), pinned.code)
})

Deno.test('frees a code once it has expired', async () => {
  using time = new FakeTime()
  const { create } = createGameCodes()
  using pinned = alwaysTheSameCode()

  assertEquals(await create(), pinned.code)

  time.tick(DAY_MS + 1)

  assertEquals(await create(), pinned.code)
})

Deno.test('holds a code for the whole day', async () => {
  using time = new FakeTime()
  const { create } = createGameCodes()
  using _pinned = alwaysTheSameCode()

  await create()

  time.tick(DAY_MS - 1)

  await assertRejects(() => create(), Error, 'unique code')
})
