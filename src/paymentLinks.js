export const isMobileDevice = () => typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

// Tries the native app's custom URL scheme first (e.g. venmo://). Goes
// through a hidden iframe rather than location.href — navigating the page
// directly to a scheme no app has registered makes Safari show a blocking
// "address is invalid" alert, which the iframe avoids. If the OS doesn't
// hand off to an app within the timeout, the tab is still visible — that's
// our signal to fall back to the web URL instead.
export function openWithAppFallback(appUrl, webUrl) {
  if (!appUrl || !isMobileDevice()) {
    if (webUrl) window.open(webUrl, '_blank', 'noopener,noreferrer')
    return
  }
  let handedOff = false
  const onVisibility = () => { if (document.hidden) handedOff = true }
  document.addEventListener('visibilitychange', onVisibility)

  const probe = document.createElement('iframe')
  probe.style.display = 'none'
  document.body.appendChild(probe)
  probe.src = appUrl

  setTimeout(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    document.body.removeChild(probe)
    if (!handedOff && webUrl) window.location.href = webUrl
  }, 1200)
}
