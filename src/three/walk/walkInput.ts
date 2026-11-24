/**
 * Shared, frame-polled input state for first-person walking. Keyboard is handled here;
 * pointer / touch / wheel input is written in by the UI layer (ui/WalkLayer.tsx).
 */

export const walkInput = {
  /** Keyboard axes (-1..1). */
  keyForward: 0,
  keyStrafe: 0,
  run: false,
  /** Virtual joystick axes (-1..1), touch devices. */
  stickForward: 0,
  stickStrafe: 0,
  /** Accumulated look deltas in radians since the last frame. */
  lookYaw: 0,
  lookPitch: 0,
  /** Pending forward step from the mouse wheel (metres). */
  wheel: 0,
}

const pressed = new Set<string>()

function update() {
  const f = (pressed.has('KeyW') || pressed.has('ArrowUp') ? 1 : 0) - (pressed.has('KeyS') || pressed.has('ArrowDown') ? 1 : 0)
  const s = (pressed.has('KeyD') || pressed.has('ArrowRight') ? 1 : 0) - (pressed.has('KeyA') || pressed.has('ArrowLeft') ? 1 : 0)
  walkInput.keyForward = f
  walkInput.keyStrafe = s
  walkInput.run = pressed.has('ShiftLeft') || pressed.has('ShiftRight')
}

const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'])

function onKeyDown(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
  if (!MOVE_KEYS.has(e.code)) return
  if (e.code.startsWith('Arrow')) e.preventDefault()
  pressed.add(e.code)
  update()
}
function onKeyUp(e: KeyboardEvent) {
  pressed.delete(e.code)
  update()
}
function onBlur() {
  pressed.clear()
  update()
}

export function installKeyboard() {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onBlur)
  return () => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('blur', onBlur)
    onBlur()
  }
}

export function resetLook() {
  walkInput.lookYaw = 0
  walkInput.lookPitch = 0
  walkInput.wheel = 0
}
