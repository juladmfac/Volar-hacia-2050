import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CARRIER_COLOR, COLOR, FORCE_COLOR } from './theme.ts'

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
const token = (name: string) => css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1]?.toLowerCase()

describe('paleta', () => {
  it('index.css y theme.ts usan los mismos colores', () => {
    for (const [k, v] of Object.entries({ ...COLOR, ...CARRIER_COLOR, ...FORCE_COLOR })) {
      expect(token(k), k).toBe(v.toLowerCase())
    }
  })
})
