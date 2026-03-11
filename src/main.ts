// New bootstrap code to inject legacy app HTML and wire handlers

function initLegacyApp() {
  const legacyHtml = `<div>Your legacy app HTML here</div>`;
  document.body.insertAdjacentHTML('beforeend', legacyHtml);
  // Add event handlers here
}

window.onload = initLegacyApp;