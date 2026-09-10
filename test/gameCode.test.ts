import { createGameCodes } from '../src/gameCode'

const DAY_MS = 24 * 60 * 60 * 1000

// Pins every candidate to the same code, so claiming and freeing are observable
const alwaysTheSameCode = () => {
  vi.spyOn(Math, 'random')
.mockReturnValue(0)
  return 'AAAA'
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

test('codes are four letters from the unambiguous alphabet', async () => {
  const { create } = createGameCodes()

  expect(await create())
    .toMatch(/^[A-FHJ-Z]{4}$/)
})

test('never hands out a code twice', async () => {
  const { create } = createGameCodes()
  const codes = await Promise.all(Array.from({ length: 200 }, create))

  expect(new Set(codes).size)
    .toEqual(codes.length)
})

test('gives up rather than looping forever when codes run out', async () => {
  const { create } = createGameCodes()
  alwaysTheSameCode()

  await create()

  await expect(create())
    .rejects
    .toThrow(/unique code/)
})

test('frees a code once it is deleted', async () => {
  const { create, delete: remove } = createGameCodes()
  const code = alwaysTheSameCode()

  expect(await create())
    .toEqual(code)
  await remove(code)

  expect(await create())
    .toEqual(code)
})

test('frees a code once it has expired', async () => {
  vi.useFakeTimers()

  const { create } = createGameCodes()
  const code = alwaysTheSameCode()

  expect(await create())
    .toEqual(code)

  vi.advanceTimersByTime(DAY_MS + 1)

  expect(await create())
    .toEqual(code)
})

test('holds a code for the whole day', async () => {
  vi.useFakeTimers()

  const { create } = createGameCodes()
  alwaysTheSameCode()

  await create()

  vi.advanceTimersByTime(DAY_MS - 1)

  await expect(create())
    .rejects
    .toThrow(/unique code/)
})
