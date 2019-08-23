// import { test, expect } from 'jest'

import { timeParse } from "./reminders"

test("8h30m", () => {
    expect(timeParse("8h30m")).toBe(510)
})

test("12H", () => {
    expect(timeParse("12H")).toBe(720)
})

test("23h12M", () => {
    expect(timeParse("23h12M")).toBe(1392)
})

test("76h5m", () => {
    expect(timeParse("76h5m")).toBe(4565)
})

test("126h05m", () => {
    expect(timeParse("126h05m")).toBe(7565)
})

test("30m", () => {
    expect(timeParse("30m")).toBe(30)
})

test("98m", () => {
    expect(timeParse("98m")).toBe(98)
})