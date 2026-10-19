import { describe, expect, it } from 'vitest'

import { isRealDate, isRealTime, maskDate, maskTime, toLocalDateTime } from './dateInput'

describe('máscaras de data e hora', () => {
  it.each([
    ['1', '1'],
    ['121', '12/1'],
    ['12112027', '12/11/2027'],
    ['12/11/2027', '12/11/2027'],
    ['12a11b20279', '12/11/2027'],
  ])('data %s vira %s', (typed, expected) => {
    expect(maskDate(typed)).toBe(expected)
  })

  it.each([
    ['15', '15'],
    ['153', '15:3'],
    ['1530', '15:30'],
    ['15:30', '15:30'],
  ])('hora %s vira %s', (typed, expected) => {
    expect(maskTime(typed)).toBe(expected)
  })
})

describe('validação', () => {
  it('aceita só datas do calendário', () => {
    expect(isRealDate('29/02/2028')).toBe(true)
    expect(isRealDate('29/02/2027')).toBe(false)
    expect(isRealDate('31/04/2027')).toBe(false)
    expect(isRealDate('12/13/2027')).toBe(false)
    expect(isRealDate('12/11/27')).toBe(false)
  })

  it('aceita horas de 00:00 a 23:59', () => {
    expect(isRealTime('00:00')).toBe(true)
    expect(isRealTime('23:59')).toBe(true)
    expect(isRealTime('24:00')).toBe(false)
    expect(isRealTime('9:30')).toBe(false)
  })
})

describe('toLocalDateTime', () => {
  it('monta o valor no formato da RN01, sem o fuso', () => {
    expect(toLocalDateTime('02/03/2027', '10:15')).toBe('2027-03-02T10:15')
  })
})
