let currentDelay = 0;
let removedAdCount = 0;
let removedSpamCount = 0;
let compactUIValue = '0';

let adBlockEnabled = false;
let isDomStable = false;
let reelsEnabled = false;
let suggestEnabled = false;
let storyEnabled = false;
let newFeedsEnabled = false;
let commentFilterEnabled = false;

let commentFilters = [];

let mainObserverTimeout;
let commentDialogObserverInstance = null;
let commentObserverInstance = null;

const updateBadge = () => {
  const countToShow = removedAdCount;
  const badgeText = formatBadgeNumber(countToShow);
  try {
    chrome.runtime.sendMessage({ action: 'updateBadgeCount', count: badgeText });
  } catch (error) {
    
  }
};

const formatBadgeNumber = (num) => {
  const thousands = Math.floor(num / 1000);
  const hundreds = Math.floor((num % 1000) / 100);
  if (num <= 0) return "";
  if (num < 1000) return String(num);
  if (num < 10000) {
    return hundreds === 0 ? `${thousands}k` : `${thousands}k${hundreds}`;
  }
  if (num < 100000) {
    return hundreds === 0 ? `${thousands}k` : `${thousands}k${hundreds}`;
  }
  return "∞";
};

const loadRemovedCounts = () => {
  chrome.storage.local.get(['removedAdCount', 'removedSpamCount'], (data) => {
    if (data.removedAdCount !== undefined) removedAdCount = data.removedAdCount;
    if (data.removedSpamCount !== undefined) removedSpamCount = data.removedSpamCount;
    updateBadge();
  });
};

const saveRemovedAdCount = () => chrome.storage.local.set({ removedAdCount });
const saveRemovedSpamCount = () => chrome.storage.local.set({ removedSpamCount });

const removeMatchingDivs = () => {
  if (!adBlockEnabled || !isDomStable) return;
  try {
    const spansByClass = Array.from(document.querySelectorAll("span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1f6kntn.xvq8zen.x1s688f.x1fey0fg"));
    const spansByAria = Array.from(document.querySelectorAll('span[aria-labelledby]'))
      .filter(span => span.getAttribute("aria-labelledby")?.includes("r26s"));

    const spansSponsored_v1 = Array.from(document.querySelectorAll("span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6.x1j85h84"))
      .filter(span => span.textContent.trim().toLowerCase() === "được tài trợ");

    const spansSponsored_v2 = document.querySelectorAll('.x1i10hfl.xjbqb8w.x1ejq31n.xd10rxx.x1sy0etr.x17r0tee.x972fbf.xcfux6l.x1qhh985.xm0m39n.x9f619.x1ypdohk.xt0psk2.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x16tdsg8.x1hl2dhg.xggy1nq.x1a2a7pz.xkrqix3.x1sur9pj.xi81zsa.x1s688f');

    spansSponsored_v2.forEach(el => {
      if (el.href && el.href.includes("ads")) {
        const closestDiv = el.closest('div.x1yztbdb.x1n2onr6.xh8yej3.x1ja2u2z');
        if (closestDiv) {
          closestDiv.remove();
          removedAdCount++;
          saveRemovedAdCount();
          updateBadge();
          console.log('Đã xóa quảng cáo:', closestDiv);
        }
      }
    });

    spansSponsored_v1.forEach(span => {
      const container = span.closest('div.x1y1aw1k');
      if (container) {
        const childDiv = container.querySelector('div');
        if (childDiv) {
          const sponsored = childDiv.querySelector('div[class=""]');
          sponsored?.remove();
          removedAdCount++;
          saveRemovedAdCount();
          updateBadge();
        }
      }
    });

    const allOtherSpans = [...spansByClass, ...spansByAria];
    allOtherSpans.forEach(span => {
      if (spansByClass.includes(span) && !span.textContent.trim().toLowerCase().includes("theo dõi")) return;
      let current = span;
      while (current) {
        if (current.tagName === "DIV" && current.classList.contains("x1lliihq")) {
          current.parentNode && current.remove();
          removedAdCount++;
          saveRemovedAdCount();
          updateBadge();
          break;
        }
        current = current.parentElement;
      }
    });

  } catch (error) {
    
  }
};

const removeReelsAndShortVideos = () => {
  if (!reelsEnabled || !isDomStable) return;
  try {
    document.querySelectorAll('span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x676frb.x1jchvi3.x1lbecb7.x1s688f.xzsf02u')
      .forEach(span => {
        if (span.textContent.includes("Reels và video ngắn")) {
          const divToRemove = span.closest('div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x78zum5.x1n2onr6.xh8yej3');
          divToRemove && requestAnimationFrame(() => divToRemove.parentNode && divToRemove.remove());
        }
      });
  } catch (error) {
    
  }
};

const removeSuggestions = () => {
  if (!suggestEnabled || !isDomStable) return;
  try {
    document.querySelectorAll('span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xtoi2st.x3x7a5m.x1603h9y.x1u7k74.x1xlr1w8.xzsf02u')
      .forEach(span => {
        const textContent = span.textContent;
        if (textContent.includes("Gợi ý cho bạn") || textContent.includes("bạn có thể sẽ thích các nhóm sau")) {
          const container = span.closest('div.x1lliihq.x1n2onr6.x4uap5') ||
            span.closest('div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x78zum5.x1n2onr6.xh8yej3');
          container && requestAnimationFrame(() => container.parentNode && container.remove());
        }
      });
    document.querySelectorAll('span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x676frb.x1jchvi3.x1lbecb7.x1s688f.xi81zsa')
      .forEach(span => {
        if (span.textContent.includes("Những người bạn có thể biết")) {
          const divToRemove = span.closest('div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x78zum5.x1n2onr6.xh8yej3');
          divToRemove && requestAnimationFrame(() => divToRemove.parentNode && divToRemove.remove());
        }
      });
  } catch (error) {
    
  }
};

const hideStories = (enabled = storyEnabled) => {
  try {
    const storyDiv = document.querySelector('div[aria-label="Tin"]');
    if (storyDiv) storyDiv.style.display = enabled ? 'none' : '';
  } catch (error) {
    
  }
};

const hideNewFeeds = (enabled = newFeedsEnabled) => {
  try {
    document.querySelectorAll('.x1hc1fzr.x1unhpq9.x6o7n8i')
      .forEach(e => e.style.display = enabled ? 'none' : '');
  } catch (error) {
    
  }
};

const removeSpamCommentsInDialog = (dialog) => {
  if (!dialog) return;
  dialog.querySelectorAll("div.x16hk5td.x12rz0ws").forEach(commentDiv => {
    commentDiv.querySelectorAll("div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.x1vvkbs").forEach(targetDiv => {
      const text = targetDiv.textContent.toLowerCase();
      if (commentFilters.some(keyword => text.includes(keyword.trim().toLowerCase()))) {
        const removeDiv = targetDiv.closest("div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1n2onr6");
        if (removeDiv) {
          console.log('Đã xóa', text);
          removeDiv.remove();
          removedSpamCount++;
          saveRemovedSpamCount();
          updateBadge();
        }
      }
    });
  });
};

const removeSpamComments = () => {
  const dialogs = document.querySelectorAll("div[role='dialog'].x1n2onr6.x1ja2u2z.x1afcbsf.xdt5ytf.x1a2a7pz.x71s49j.x1qjc9v5.xrjkcco.x58fqnu.x1mh14rs.xfkwgsy.x78zum5.x1plvlek.xryxfnj.xcatxm7.xrgej4m.xh8yej3");
  dialogs.forEach(dialog => removeSpamCommentsInDialog(dialog));
};

const observeDialog = (dialog) => {
  removeSpamCommentsInDialog(dialog);
  const dialogObserver = new MutationObserver(() => removeSpamCommentsInDialog(dialog));
  dialogObserver.observe(dialog, { childList: true, subtree: true });
};

const bodyObserver = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.matches && node.matches("div[role='dialog'].x1n2onr6.x1ja2u2z.x1afcbsf.xdt5ytf.x1a2a7pz.x71s49j.x1qjc9v5.xrjkcco.x58fqnu.x1mh14rs.xfkwgsy.x78zum5.x1plvlek.xryxfnj.xcatxm7.xrgej4m.xh8yej3")) {
          observeDialog(node);
        } else {
          node.querySelectorAll("div[role='dialog'].x1n2onr6.x1ja2u2z.x1afcbsf.xdt5ytf.x1a2a7pz.x71s49j.x1qjc9v5.xrjkcco.x58fqnu.x1mh14rs.xfkwgsy.x78zum5.x1plvlek.xryxfnj.xcatxm7.xrgej4m.xh8yej3")
            .forEach(dialog => observeDialog(dialog));
        }
      }
    });
  });
});

bodyObserver.observe(document.body, { childList: true, subtree: true });
removeSpamComments();

const mainObserver = new MutationObserver(() => {
  isDomStable = true;
  removeMatchingDivs();
  removeReelsAndShortVideos();
  removeSuggestions();
  hideNewFeeds();
  hideStories();
});

const observeDOM = () => mainObserver.observe(document.body, { childList: true, subtree: true });
const disconnectMainObserver = () => {
  clearTimeout(mainObserverTimeout);
  mainObserver.disconnect();
  isDomStable = false;
};

const applyCompactUI = (value) => {
  try {
    const shortcutsSidebar = document.querySelector('div[aria-label="Lối tắt"], div[aria-label="Shortcuts"]');
    const rightSidebar = document.querySelector('div[role="complementary"]');
    if (shortcutsSidebar) shortcutsSidebar.style.display = (value === '1' || value === '3') ? "none" : '';
    if (rightSidebar) rightSidebar.style.display = (value === '2' || value === '3') ? "none" : '';
  } catch (error) {
    
  }
};

const commentContentObserverCallback = (mutationsList) => {
  for (let mutation of mutationsList) {
    if ((mutation.type === 'childList' && mutation.addedNodes.length > 0) ||
      mutation.type === 'characterData') {
      requestAnimationFrame(removeSpamComments);
      break;
    }
  }
};

const commentDialogObserverCallback = (mutationsList) => {
  if (!commentFilterEnabled) return;
  for (let mutation of mutationsList) {
    if (mutation.addedNodes.length) {
      for (let node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const dialog = node.matches("div[role='dialog'][aria-label*='bình luận'], div[role='dialog'][aria-label*='comment']")
            ? node
            : node.querySelector("div[role='dialog'][aria-label*='bình luận'], div[role='dialog'][aria-label*='comment']");
          if (dialog) {
            if (commentObserverInstance) commentObserverInstance.disconnect();
            commentObserverInstance = new MutationObserver(commentContentObserverCallback);
            commentObserverInstance.observe(dialog, { childList: true, subtree: true, characterData: true });
            removeSpamComments();
            return;
          }
        }
      }
    }
  }
};

const startCommentObservers = () => {
  if (!commentFilterEnabled || commentDialogObserverInstance) return;
  commentDialogObserverInstance = new MutationObserver(commentDialogObserverCallback);
  commentDialogObserverInstance.observe(document.body, { childList: true, subtree: true });
};

const stopCommentObservers = () => {
  commentDialogObserverInstance?.disconnect();
  commentDialogObserverInstance = null;
  commentObserverInstance?.disconnect();
  commentObserverInstance = null;
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'toggleAdBlock':
      adBlockEnabled = request.enabled;
      if (adBlockEnabled) {
        observeDOM();
        removeMatchingDivs();
      } else if (!reelsEnabled && !suggestEnabled && !commentFilterEnabled && !storyEnabled && !newFeedsEnabled && compactUIValue === '0') {
        disconnectMainObserver();
      }
      sendResponse({ status: 'Ad block toggled' });
      break;
    case 'toggleReels':
      reelsEnabled = request.enabled;
      if (reelsEnabled) {
        observeDOM();
        removeReelsAndShortVideos();
      } else if (!adBlockEnabled && !suggestEnabled && !commentFilterEnabled && !storyEnabled && !newFeedsEnabled && compactUIValue === '0') {
        disconnectMainObserver();
      }
      sendResponse({ status: 'Reels toggle updated' });
      break;
    case 'toggleSuggest':
      suggestEnabled = request.enabled;
      if (suggestEnabled) {
        observeDOM();
        removeSuggestions();
      } else if (!adBlockEnabled && !reelsEnabled && !commentFilterEnabled && !storyEnabled && !newFeedsEnabled && compactUIValue === '0') {
        disconnectMainObserver();
      }
      sendResponse({ status: 'Suggest toggle updated' });
      break;
    case 'toggleStory':
      storyEnabled = request.enabled;
      hideStories(storyEnabled);
      sendResponse({ status: 'Story toggle updated' });
      break;
    case 'toggleNewFeeds':
      newFeedsEnabled = request.enabled;
      hideNewFeeds(newFeedsEnabled);
      sendResponse({ status: 'New Feeds toggle updated' });
      break;
    case 'setCompactUI':
      compactUIValue = request.value;
      applyCompactUI(compactUIValue);
      sendResponse({ status: 'Compact UI updated' });
      break;
    case 'toggleCommentFilter':
      commentFilterEnabled = request.enabled;
      commentFilters = Array.isArray(request.filters) ? request.filters : [];
      if (commentFilterEnabled) {
        startCommentObservers();
        removeSpamComments();
      } else {
        stopCommentObservers();
      }
      sendResponse({ status: 'Comment Filter toggled' });
      break;
    default:
      sendResponse({ status: 'Unknown action' });
      break;
  }
  return true;
});

chrome.storage.sync.get(
  ['adBlockEnabled', 'reelsEnabled', 'suggestEnabled', 'storyEnabled', 'compactUIValue', 'newFeedsEnabled', 'commentFilterEnabled', 'commentFilters'],
  (data) => {
    adBlockEnabled = data.adBlockEnabled === true;
    reelsEnabled = data.reelsEnabled === true;
    storyEnabled = data.storyEnabled === true;
    newFeedsEnabled = data.newFeedsEnabled === true;
    suggestEnabled = data.suggestEnabled === true;
    commentFilterEnabled = data.commentFilterEnabled === true;
    const storedFilters = data.commentFilters;
    if (typeof storedFilters === 'string') {
      commentFilters = storedFilters.split(',').map(f => f.trim()).filter(f => f !== "");
    } else {
      commentFilters = ['88uytin', 'cho vay', 'l.php?u=', 'v.ay', 'vb88', '789uytin'];
    }
    compactUIValue = data.compactUIValue || '0';
    applyCompactUI(compactUIValue);
    hideStories(storyEnabled);
    hideNewFeeds(newFeedsEnabled);
    if (adBlockEnabled || reelsEnabled || suggestEnabled) {
      observeDOM();
    }
    if (commentFilterEnabled) {
      startCommentObservers();
    }
    const runInitialCleanup = () => {
      isDomStable = true;
      if (adBlockEnabled) removeMatchingDivs();
      if (reelsEnabled) removeReelsAndShortVideos();
      if (suggestEnabled) removeSuggestions();
      if (commentFilterEnabled) removeSpamComments();
    };
    if (document.readyState === 'complete') {
      runInitialCleanup();
    } else {
      window.addEventListener("load", runInitialCleanup, { once: true });
    }
    loadRemovedCounts();
  }
);
