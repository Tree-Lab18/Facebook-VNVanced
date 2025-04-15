let badgeCount = 0;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateBadgeCount') {
    badgeCount = typeof request.count === 'number' || typeof request.count === 'string' ? request.count : 0;
    updateBadgeText();
    return false; 
  }
  return false;
});

const updateBadgeText = () => {
  const countValue = badgeCount || 0;
  const text = countValue ? String(countValue) : "";
  
  if (chrome.action && chrome.action.setBadgeText) {
    chrome.action.setBadgeText({ text }, () => {
      if (chrome.runtime.lastError) {
        
      }
    });
    if (text && chrome.action.setBadgeBackgroundColor && chrome.action.setBadgeTextColor) {
      try {
        chrome.action.setBadgeTextColor({ color: 'white' });
        chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
      } catch (e) {
        
      }
    }
  }
};


chrome.runtime.onStartup.addListener(() => {
  
  badgeCount = 0;
  updateBadgeText();
});


chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install" || details.reason === "update") {
    
    badgeCount = 0;
    updateBadgeText();

    chrome.storage.sync.get(null, (items) => {
      const defaults = {
        adBlockEnabled: true,
        reelsEnabled: false,
        suggestEnabled: false,
        compactUIValue: '0',
        storyEnabled: false,
        newFeedsEnabled: false,
        commentFilterEnabled: false,
        commentFilters: 'vay, 88uytin,vb88,789uytin, l.php?u='
      };
      let settingsToSet = {};
      let changed = false;
      for (const key in defaults) {
        if (!(key in items)) {
          settingsToSet[key] = defaults[key];
          changed = true;
        }
      }
      if (changed) {
        chrome.storage.sync.set(settingsToSet, () => {
          if (chrome.runtime.lastError) {
            
          } else {
            
          }
        });
      } else {
        
      }
    });
  }
});
