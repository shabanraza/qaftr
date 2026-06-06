/** React Native Hermes may not expose global `crypto` — use this instead. */
let counter = 0;
export function newId(prefix = "id") {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}
