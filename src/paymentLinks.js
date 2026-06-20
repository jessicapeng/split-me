export const isMobileDevice = () => typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

// Tries the native app's custom URL scheme first (e.g. venmo://). If the OS
// doesn't hand off to an app within the timeout, the tab is still visible —
// that's our signal to fall back to the web URL instead.
export function openWithAppFallback(appUrl, webUrl) {
  if (!appUrl || !isMobileDevice()) {
    if (webUrl) window.open(webUrl, '_blank', 'noopener,noreferrer')
    return
  }
  let handedOff = false
  const onVisibility = () => { if (document.hidden) handedOff = true }
  document.addEventListener('visibilitychange', onVisibility)
  window.location.href = appUrl
  setTimeout(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    if (!handedOff && webUrl) window.location.href = webUrl
  }, 1200)
}
