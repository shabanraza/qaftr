import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

// The default 1s wait for findBy/waitFor is too short when the whole suite runs
// in parallel (signature checks and Radix renders slow down); 5s still fails fast.
configure({ asyncUtilTimeout: 5000 })

// Vitest runs without globals, so Testing Library cannot auto-register cleanup.
afterEach(() => cleanup())

// jsdom has no ResizeObserver; Radix primitives (RadioGroup, Checkbox) measure
// their hidden form inputs with it. Tests that need their own stub still win.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
