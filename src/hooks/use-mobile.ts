import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Subscribes to matchMedia changes; React applies the snapshot immediately,
 * so no setState needs to run synchronously inside an effect.
 */
function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

/**
 * `false` during SSR/hydration — identical to the previous implementation
 * where the flag started as `undefined` until the first client effect ran.
 */
function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
