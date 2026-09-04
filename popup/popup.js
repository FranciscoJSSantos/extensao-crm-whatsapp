document.addEventListener('DOMContentLoaded', () => {
  const openWaBtn = document.getElementById('btn-open-wa');

  if (openWaBtn) {
    openWaBtn.addEventListener('click', () => {
      chrome.tabs.query({ url: '*://web.whatsapp.com/*' }, (tabs) => {
        if (tabs && tabs.length > 0) {
          chrome.tabs.update(tabs[0].id, { active: true });
          if (tabs[0].windowId) {
            chrome.windows.update(tabs[0].windowId, { focused: true });
          }
        } else {
          chrome.tabs.create({ url: 'https://web.whatsapp.com' });
        }
      });
    });
  }
});
