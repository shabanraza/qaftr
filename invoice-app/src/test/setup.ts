import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

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
