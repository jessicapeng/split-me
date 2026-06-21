export const isMobileDevice = () => typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

// Tries the native app's custom URL scheme first (e.g. venmo://), navigating
// directly via location.href. (A hidden-iframe probe used to be needed to
// dodge a Safari "address is invalid" alert, but WebKit now blocks iframes
// from navigating to non-http(s) schemes entirely, so it never reached the
// app — direct navigation is what actually triggers the OS handoff.) If the
// OS doesn't hand off to an app within the timeout, the tab is still
// visible — that's our signal to fall back to the web URL instead.
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
