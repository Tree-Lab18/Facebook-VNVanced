document.addEventListener("DOMContentLoaded", () => {

  const themeToggleButton = document.getElementById("themeToggle")
  const bodyElement = document.body
  const logoToggle = document.getElementById("logoToggle")
  const qrScanContainer = document.getElementById("qrScanContainer")
  const showMoreButton = document.getElementById("showMore")
  const moreOptionsDiv = document.getElementById("moreOptions")
  const adBlockToggle = document.getElementById("adBlockToggle")
  const postsToggle = document.getElementById("postsToggle")
  const groupPostsToggle = document.getElementById("groupPostsToggle")
  const pagePostsToggle = document.getElementById("pagePostsToggle")
  const reelsToggle = document.getElementById("reelsToggle")
  const suggestToggle = document.getElementById("suggestToggle")
  const storyToggle = document.getElementById("storyToggle")
  const newFeedsToggle = document.getElementById("newFeedsToggle")
  const commentFilterToggle = document.getElementById("commentFilterToggle")
  const commentFiltersTextarea = document.getElementById("commentFilters")
  const compactUISelect = document.getElementById("compactUISelect")
  const adCountElement = document.getElementById("removedAdCountDisplay")
  const spamCountElement = document.getElementById("removedSpamCountDisplay")
  const donateLink = document.getElementById("donateLink")

  let currentTabId = null
  let currentTabUrl = null
  loadThemePreference()
  setupInitialTabInfo()
  addEventListeners()
  loadSettingsAndCounts()
  function applyTheme(theme) {
    if (!bodyElement) return

    bodyElement.dataset.theme = theme
    if (themeToggleButton) {
      themeToggleButton.title = `Chuyển sang giao diện ${theme === "dark" ? "Sáng" : "Tối"}`
    }
  }

  function toggleTheme() {
    const currentTheme = bodyElement.dataset.theme || "dark"
    const newTheme = currentTheme === "dark" ? "light" : "dark"
    applyTheme(newTheme)

    chrome.storage.local.set({ theme: newTheme }, () => {
      if (chrome.runtime.lastError) {
        
      }
    })
  }

  function loadThemePreference() {
    chrome.storage.local.get("theme", (data) => {
      if (chrome.runtime.lastError) {
        
        applyTheme("dark")
        return
      }
      const savedTheme = data.theme || "dark"
      applyTheme(savedTheme)
    })
  }

  function setupInitialTabInfo() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0 && tabs[0]) {
        currentTabId = tabs[0].id
        currentTabUrl = tabs[0].url
      }
    })
  }

  function isValidFacebookTab(url) {
    if (!url) return false
    try {
      const parsedUrl = new URL(url)
      const hostname = parsedUrl.hostname
      return (
        hostname === "facebook.com" ||
        hostname.endsWith(".facebook.com") ||
        hostname === "messenger.com" ||
        hostname.endsWith(".messenger.com")
      )
    } catch (e) {
      return false
    }
  }

  function addEventListeners() {

    themeToggleButton?.addEventListener("click", toggleTheme)
    if (donateLink && qrScanContainer) {
      donateLink.addEventListener("click", (event) => {
        event.stopPropagation()
        const isVisible = qrScanContainer.style.display === "block"

        if (isVisible) {
          qrScanContainer.style.display = "none"
        } else {
          const linkRect = donateLink.getBoundingClientRect()
          const bodyRect = document.body.getBoundingClientRect()

          qrScanContainer.style.top = linkRect.bottom - bodyRect.top + 5 + "px"
          qrScanContainer.style.left = linkRect.left - bodyRect.left + "px"
          qrScanContainer.style.display = "block"
        }
      })

      document.addEventListener("click", (event) => {
        if (
          qrScanContainer.style.display === "block" &&
          !qrScanContainer.contains(event.target) &&
          event.target !== donateLink
        ) {
          qrScanContainer.style.display = "none"
        }
      })
    }

    if (showMoreButton && moreOptionsDiv) {
      showMoreButton.addEventListener("click", () => {
        const isHidden = !moreOptionsDiv.style.display || moreOptionsDiv.style.display === "none"
        moreOptionsDiv.style.display = isHidden ? "block" : "none"
        showMoreButton.setAttribute("aria-expanded", isHidden)
      })
    }

    if (logoToggle && adBlockToggle) {
      logoToggle.addEventListener("click", () => {
        const newState = !adBlockToggle.checked
        adBlockToggle.checked = newState
        handleSettingChange("adBlockEnabled", newState, {
          action: "toggleAdBlock",
          enabled: newState,
        })
        updateIcon(newState)
      })
    }

    adBlockToggle?.addEventListener("change", (e) => {
      const currentState = e.target.checked;
      handleSettingChange("adBlockEnabled", currentState, {
        action: "toggleAdBlock",
        enabled: currentState,
      });
      updateIcon(currentState);
    });

    postsToggle?.addEventListener("change", (e) =>
      handleSettingChange("postsEnabled", e.target.checked, {
        action: "togglePosts",
        enabled: e.target.checked,
      }),
    )

    groupPostsToggle?.addEventListener("change", (e) =>
      handleSettingChange("groupPostsEnabled", e.target.checked, {
        action: "toggleGroupPosts",
        enabled: e.target.checked,
      }),
    )

    pagePostsToggle?.addEventListener("change", (e) =>
      handleSettingChange("pagePostsEnabled", e.target.checked, {
        action: "togglePagePosts",
        enabled: e.target.checked,
      }),
    )

    reelsToggle?.addEventListener("change", (e) =>
      handleSettingChange("reelsEnabled", e.target.checked, {
        action: "toggleReels",
        enabled: e.target.checked,
      }),
    )

    suggestToggle?.addEventListener("change", (e) =>
      handleSettingChange("suggestEnabled", e.target.checked, {
        action: "toggleSuggest",
        enabled: e.target.checked,
      }),
    )

    storyToggle?.addEventListener("change", (e) =>
      handleSettingChange("storyEnabled", e.target.checked, {
        action: "toggleStory",
        enabled: e.target.checked,
      }),
    )

    newFeedsToggle?.addEventListener("change", (e) =>
      handleSettingChange("newFeedsEnabled", e.target.checked, {
        action: "toggleNewFeeds",
        enabled: e.target.checked,
      }),
    )

    commentFilterToggle?.addEventListener("change", () => {
      const enabled = commentFilterToggle.checked
      const filters = getCommentFilters()
      updateSetting("commentFilterEnabled", enabled)
      sendMessageToContentScript({
        action: "toggleCommentFilter",
        enabled,
        filters,
      })
    })

    commentFiltersTextarea?.addEventListener("blur", () => {
      updateSetting("commentFilters", commentFiltersTextarea.value)
      if (commentFilterToggle?.checked) {
        sendMessageToContentScript({
          action: "toggleCommentFilter",
          enabled: true,
          filters: getCommentFilters(),
        })
      }
    })

    compactUISelect?.addEventListener("change", (e) =>
      handleSettingChange("compactUIValue", e.target.value, {
        action: "setCompactUI",
        value: e.target.value,
      }),
    )
  }
  function loadSettingsAndCounts() {
    chrome.storage.sync.get(
      [
        "adBlockEnabled",
        "postsEnabled",
        "groupPostsEnabled",
        "pagePostsEnabled",
        "reelsEnabled",
        "suggestEnabled",
        "storyEnabled",
        "newFeedsEnabled",
        "commentFilterEnabled",
        "commentFilters",
        "compactUIValue",
      ],
      (data) => {
        if (chrome.runtime.lastError) {
          
          return
        }

        try {
          const adBlockEnabled = data.adBlockEnabled !== false
          if (adBlockToggle) adBlockToggle.checked = adBlockEnabled
          updateIcon(adBlockEnabled)
          if (postsToggle) postsToggle.checked = data.postsEnabled === true
          if (groupPostsToggle) groupPostsToggle.checked = data.groupPostsEnabled === true
          if (pagePostsToggle) pagePostsToggle.checked = data.pagePostsEnabled === true
          if (reelsToggle) reelsToggle.checked = data.reelsEnabled === true
          if (suggestToggle) suggestToggle.checked = data.suggestEnabled === true
          if (storyToggle) storyToggle.checked = data.storyEnabled === true
          if (newFeedsToggle) newFeedsToggle.checked = data.newFeedsEnabled === true
          if (commentFilterToggle) commentFilterToggle.checked = data.commentFilterEnabled === true
          if (commentFiltersTextarea) {
            const defaultFilters = "vay,inbox zalo,ib zalo,.php?u=,.xyz"
            commentFiltersTextarea.value =
              typeof data.commentFilters === "string" ? data.commentFilters : defaultFilters
          }
          if (compactUISelect) {
            compactUISelect.value = data.compactUIValue || "0"
          }
        } catch (e) {
          
        }
      },
    )
    chrome.storage.local.get(["removedAdCount", "removedSpamCount"], (data) => {
      if (chrome.runtime.lastError) {
        
        updateUICounts(0, 0)
      } else {
        updateUICounts(data.removedAdCount || 0, data.removedSpamCount || 0)
      }
    })
  }

  function handleSettingChange(key, value, messagePayload) {
    updateSetting(key, value)
    if (messagePayload) {
      sendMessageToContentScript(messagePayload)
    }
  }

  function updateSetting(key, value) {
    chrome.storage.sync.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        
      }
    })
  }

  function updateUICounts(adCount, spamCount) {
    if (adCountElement) adCountElement.textContent = formatDisplayCount(adCount)
    if (spamCountElement) spamCountElement.textContent = formatDisplayCount(spamCount)
  }

  function formatDisplayCount(num) {
    const number = Number(num) || 0
    return new Intl.NumberFormat("vi-VN").format(number)
  }

  function getCommentFilters() {
    if (!commentFiltersTextarea) return []

    return commentFiltersTextarea.value
      .split(/[\n,]+/)
      .map((line) => line.trim().toLowerCase())
      .filter((line) => line !== "")
  }

  function sendMessageToContentScript(message) {
    if (!currentTabId) return

    chrome.tabs.sendMessage(currentTabId, message, (response) => {
      const error = chrome.runtime.lastError
      if (error) {
       
      }
    })
  }

  function updateIcon(isEnabled) {
    const iconPaths = isEnabled
      ? {
        16: "icons/icon16.png",
        48: "icons/icon48.png",
        128: "icons/icon128.png",
      }
      : {
        16: "icons/icon16_disabled.png",
        48: "icons/icon48_disabled.png",
        128: "icons/icon128_disabled.png",
      }

    try {
      if (chrome.action && typeof chrome.action.setIcon === "function") {
        chrome.action.setIcon({ path: iconPaths })
      } else if (chrome.browserAction && typeof chrome.browserAction.setIcon === "function") {
        chrome.browserAction.setIcon({ path: iconPaths })
      }
    } catch (e) {
      
    }

    if (logoToggle) {
      logoToggle.src = isEnabled ? "icons/icon128.png" : "icons/icon128_disabled.png"
      logoToggle.title = isEnabled ? "Đang bật (Nhấn để tắt)" : "Đang tắt (Nhấn để bật)"
    }
  }
})
