const analyticsId = 'G-F5P08EW3SV';
const cookieConsentKey = 'morlaCookieConsent';

window.dataLayer = window.dataLayer || [];

function gtag() {
  window.dataLayer.push(arguments);
}

function enableAnalytics() {
  if (document.querySelector(`script[src*="${analyticsId}"]`)) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
  document.head.appendChild(script);

  gtag('js', new Date());
  gtag('config', analyticsId);
}

window.enableAnalytics = enableAnalytics;

if (localStorage.getItem(cookieConsentKey) === 'accepted') {
  enableAnalytics();
}
