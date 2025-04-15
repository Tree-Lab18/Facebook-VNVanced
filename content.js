let currentDelay = 1000;
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
let groupPostsEnabled = false;
let pagePostsEnabled = false;
let postsEnabled = false;

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
  if (num <= 0) return "";
  if (num < 1000) return String(num);

  const thousands = Math.floor(num / 1000);
  const hundreds = Math.floor((num % 1000) / 100);

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

const delayedRemove = (callback) => {
  if (!isDomStable) return;
  setTimeout(callback, currentDelay);
};

const removeMatchingDivs = () => {
  if (!adBlockEnabled) return;

  delayedRemove(() => {
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
            requestAnimationFrame(() => {
              closestDiv.remove();
              removedAdCount++;
              saveRemovedAdCount();
              updateBadge();
              
            });
          }
        }
      });

      spansSponsored_v1.forEach(span => {
        const container = span.closest('div.x1y1aw1k');
        if (container) {
          const childDiv = container.querySelector('div');
          if (childDiv) {
            const sponsored = childDiv.querySelector('div[class=""]');
            if (sponsored) {
              requestAnimationFrame(() => {
                sponsored.remove();
                removedAdCount++;
                saveRemovedAdCount();
                updateBadge();
              });
            }
          }
        }
      });

      const allOtherSpans = [...spansByClass, ...spansByAria];
      allOtherSpans.forEach(span => {
        if (spansByClass.includes(span) && !span.textContent.trim().toLowerCase().includes("theo dõi")) return;

        let current = span;
        while (current) {
          if (current.tagName === "DIV" && current.classList.contains("x1lliihq")) {
            requestAnimationFrame(() => {
              if (current.parentNode) {
                current.remove();
                removedAdCount++;
                saveRemovedAdCount();
                updateBadge();
              }
            });

            document.querySelectorAll('div[class="x1lliihq"]').forEach(el => {
              if (el.offsetHeight === 0) {
                requestAnimationFrame(() => el.remove());
              }
            });
            break;
          }
          current = current.parentElement;
        }
      });

    } catch (error) {
      
    }
  });
};

const removeReelsAndShortVideos = () => {
  if (!reelsEnabled) return;

  delayedRemove(() => {
    try {
      document.querySelectorAll(
        'span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x676frb.x1jchvi3.x1lbecb7.x1s688f.xzsf02u'
      ).forEach(span => {
        if (span.textContent.includes("Reels và video ngắn")) {
          const divToRemove = span.closest(
            'div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x78zum5.x1n2onr6.xh8yej3'
          );
          if (divToRemove) {
            requestAnimationFrame(() => divToRemove.remove());
          }
        }
      });

      document.querySelectorAll('a[role="link"][href*="reel"]').forEach(reelLink => {
        const container = reelLink.closest('div[class=""]');
        if (container) {
          const wrapper = container.closest('div.x1lliihq');
          if (wrapper) {
            requestAnimationFrame(() => wrapper.remove());
          }
        }
      });

    } catch (error) {
      
    }
  });
};

const removePagePosts = () => {
  if (!pagePostsEnabled) return;

  delayedRemove(() => {
    try {
      const links = document.querySelectorAll('a[role="link"][href*="-UC%2CP-R"]:not([href*="groups"])');
      links.forEach(page => {
        const div = page.closest('div[class=""]')?.closest(".x1lliihq");
        if (div) {
          requestAnimationFrame(() => div.remove());
        }
      });
    } catch (error) {
    }
  });
};

const removePost = () => {
  if (!postsEnabled) return;
  delayedRemove(() => {
    try {
      document.querySelectorAll('a[role="link"][href*="C%2CP-R"]:not([href*="groups"]').forEach(post => {
        const div = post.closest('div[class=""]').closest(".x1lliihq");
        if (div) {
          requestAnimationFrame(() => div.remove());
        }
      })
    } catch (error) {
    }
  })
};

const removeGroupPosts = () => {
  if (!groupPostsEnabled) return;

  delayedRemove(() => {
    try {
      const groupLinks = Array.from(
        document.querySelectorAll('a[role="link"][href*="groups"]')
      );
      groupLinks.forEach(link => {
       
        const container = link.closest('div[class=""]');
        if (container) {
         
          const targetDiv = container.closest('div.x1lliihq');
          if (targetDiv) {
            requestAnimationFrame(() => targetDiv.remove());
          }
        }
      });
    } catch (error) {
      
    }
  });
};

const removeSuggestions = () => {
  if (!suggestEnabled) return;

  delayedRemove(() => {
    try {
      document.querySelectorAll('span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xtoi2st.x3x7a5m.x1603h9y.x1u7k74.x1xlr1w8.xzsf02u')
        .forEach(span => {
          const textContent = span.textContent;
          if (textContent.includes("Gợi ý cho bạn") || textContent.includes("bạn có thể sẽ thích các nhóm sau")) {
            const container = span.closest('div.x1lliihq.x1n2onr6.x4uap5') ||
              span.closest('div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x78zum5.x1n2onr6.xh8yej3');
            if (container) {
              requestAnimationFrame(() => container.parentNode && container.remove());
            }
          }
        });

      document.querySelectorAll('span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x676frb.x1jchvi3.x1lbecb7.x1s688f.xi81zsa')
        .forEach(span => {
          if (span.textContent.includes("Những người bạn có thể biết")) {
            const divToRemove = span.closest('div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x78zum5.x1n2onr6.xh8yej3');
            if (divToRemove) {
              requestAnimationFrame(() => divToRemove.parentNode && divToRemove.remove());
            }
          }
        });
    } catch (error) {
      
    }
  });
};

const hideStories = (enabled = storyEnabled) => {
  delayedRemove(() => {
    try {
      const storyDiv = document.querySelector('div[aria-label="Tin"]');
      if (storyDiv) storyDiv.style.display = enabled ? 'none' : '';
    } catch (error) {
      
    }
  });
};

const hideNewFeeds = (enabled = newFeedsEnabled) => {
  delayedRemove(() => {
    try {
      document.querySelectorAll('.x1hc1fzr.x1unhpq9.x6o7n8i')
        .forEach(e => e.style.display = enabled ? 'none' : '');
    } catch (error) {
      
    }
  });
};

const removeSpamCommentsInDialog = (dialog) => {
  if (!dialog || !commentFilterEnabled) return;

  delayedRemove(() => {
    try {
      dialog.querySelectorAll("div.x16hk5td.x12rz0ws").forEach(commentDiv => {
        commentDiv.querySelectorAll("div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.x1vvkbs").forEach(targetDiv => {
          const text = targetDiv.textContent.toLowerCase();
          if (commentFilters.some(keyword => text.includes(keyword.trim().toLowerCase()))) {
            const removeDiv = targetDiv.closest("div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1n2onr6");
            if (removeDiv) {
              
              requestAnimationFrame(() => {
                removeDiv.remove();
                removedSpamCount++;
                saveRemovedSpamCount();
                updateBadge();
              });
            }
          }
        });
      });
    } catch (error) {
      
    }
  });
};

const removeSpamComments = () => {
  if (!commentFilterEnabled) return;

  delayedRemove(() => {
    try {
      const dialogs = document.querySelectorAll("div[role='dialog'].x1n2onr6.x1ja2u2z.x1afcbsf.xdt5ytf.x1a2a7pz.x71s49j.x1qjc9v5.xrjkcco.x58fqnu.x1mh14rs.xfkwgsy.x78zum5.x1plvlek.xryxfnj.xcatxm7.xrgej4m.xh8yej3");
      dialogs.forEach(dialog => removeSpamCommentsInDialog(dialog));
    } catch (error) {
      
    }
  });
};

const observeDialog = (dialog) => {
  if (!dialog) return;

  removeSpamCommentsInDialog(dialog);
  const dialogObserver = new MutationObserver(() => removeSpamCommentsInDialog(dialog));
  dialogObserver.observe(dialog, { childList: true, subtree: true });
};

const applyCompactUI = (value) => {
  delayedRemove(() => {
    try {
      const shortcutsSidebar = document.querySelector('div[aria-label="Lối tắt"], div[aria-label="Shortcuts"]');
      const rightSidebar = document.querySelector('div[role="complementary"]');
      if (shortcutsSidebar) shortcutsSidebar.style.display = (value === '1' || value === '3') ? "none" : '';
      if (rightSidebar) rightSidebar.style.display = (value === '2' || value === '3') ? "none" : '';
    } catch (error) {
      
    }
  });
};

const bodyObserver = new MutationObserver((mutations) => {
  if (!commentFilterEnabled) return;

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

const mainObserver = new MutationObserver(() => {
  isDomStable = true;
  if (adBlockEnabled) removeMatchingDivs();
  if (reelsEnabled) removeReelsAndShortVideos();
  if (suggestEnabled) removeSuggestions();
  if (groupPostsEnabled) removeGroupPosts();
  if (pagePostsEnabled) removePagePosts();
  if (postsEnabled) removePost();
  if (newFeedsEnabled) hideNewFeeds();
  if (storyEnabled) hideStories();
});

const observeDOM = () => mainObserver.observe(document.body, { childList: true, subtree: true });
const disconnectMainObserver = () => {
  clearTimeout(mainObserverTimeout);
  mainObserver.disconnect();
  isDomStable = false;
};

const startCommentObservers = () => {
  if (!commentFilterEnabled || commentDialogObserverInstance) return;
  commentDialogObserverInstance = new MutationObserver(commentDialogObserverCallback);
  commentDialogObserverInstance.observe(document.body, { childList: true, subtree: true });
  bodyObserver.observe(document.body, { childList: true, subtree: true });
};

const stopCommentObservers = () => {
  if (commentDialogObserverInstance) {
    commentDialogObserverInstance.disconnect();
    commentDialogObserverInstance = null;
  }
  if (commentObserverInstance) {
    commentObserverInstance.disconnect();
    commentObserverInstance = null;
  }
  bodyObserver.disconnect();
};

(function () {
  'use strict';

 
  const newHtml = `
      <div class="html-div xdj266r x11i5rnm xat24cr x1mh8g0r x6s0dn4 x78zum5 xdt5ytf xl56j7k x1p5oq8j xxbr6pl xwxc41k xbbxn1n">
          <div class="html-div xdj266r x11i5rnm x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd xieb3on" style="text-align: center;">
              <img src="chrome-extension://kpgfpphllnahfdnlklcnmnnkplphifgc/icons/icon128.png"
                   alt="Facebook VNVanced icon"
                   width="112"
                   height="112"
                   class="xfx01vb x1lliihq x1tzjh5l x1k90msu x2h7rmj x1qfuztq"
                   style="--color: var(--primary-icon); object-fit: contain; display: inline-block;">
          </div>
          <div class="x78zum5 xdt5ytf x4cne27 xifccgj">
              <div class="xzueoph x1k70j0n">
                  <h3 dir="auto" class="html-h3 xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x1vvkbs x1heor9g x1qlqyl8 x1pd3egz x1a2a7pz x193iq5w xeuugli">
                      <span class="x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s92wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x xtoi2st x3x7a5m x1603h9y x1u7k74 x1xlr1w8 xi81zsa x2b8uid" dir="auto">
                          Facebook VNVanced
                      </span>
                  </h3>
              </div>
              <div class="xzueoph x1k70j0n">
                  <span class="x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s92wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x xudqn12 x676frb x1jchvi3 x1lbecb7 xo1l8bm xi81zsa x2b8uid" dir="auto" style="line-height: 1.5;">
                      Phát triển bởi <a href="https://www.facebook.com/Ki3tNgu/" target="_blank" rel="noopener noreferrer" class="dev-link">Nguyễn Anh Kiệt</a>
                      <br>
                      <div class="support-wrapper" style="position: relative; display: inline-block; margin-top: 8px;">
                          <span class="support-text">ủng hộ tác giả</span>
                          <img src="chrome-extension://kpgfpphllnahfdnlklcnmnnkplphifgc/icons/qr.png"
                               alt="QR ủng hộ tác giả"
                               class="qr-code"
                               style="display: none;
                                      position: absolute;
                                      bottom: 100%;
                                      left: 50%;
                                      transform: translateX(-50%);
                                      margin-bottom: 5px;
                                      border: 1px solid #ccc;
                                      background: white;
                                      padding: 5px;
                                      border-radius: 4px;
                                      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                                      z-index: 100;
                                      width: 100px;
                                      height: 100px;">
                      </div>
                  </span>
              </div>
          </div>
          <div class="html-div x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd xqui205">
             <div aria-label="Tải lại trang" class="x1i10hfl xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x972fbf xcfux6l x1qhh985 xm0m39n x1ypdohk xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1o1ewxj x3x9cwd x1e5q0jg x13rtm0m x87ps6o x1lku1pv x1a2a7pz x9f619 x3nfvp2 xdt5ytf xl56j7k x1n2onr6 xh8yej3 reload-button" role="button" tabindex="0">
                  <div role="none" class="x1ja2u2z x78zum5 x2lah0s x1n2onr6 xl56j7k x6s0dn4 xozqiw3 x1q0g3np xi112ho x17zwfj4 x585lrc x1403ito x972fbf xcfux6l x1qhh985 xm0m39n x9f619 xn6708d x1ye3gou xtvsq51 x1r1pt67">
                      <div class="x6s0dn4 x78zum5 xl56j7k x1608yet xljgi0e x1e0frkt">
                          <div role="none" class="x9f619 x1n2onr6 x1ja2u2z x193iq5w xeuugli x6s0dn4 x78zum5 x2lah0s x1fbi1t2 xl8fo4v">
                              <span class="x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s92wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x xudqn12 x3x7a5m x1f6kntn xvq8zen x1s688f xtk6v10" dir="auto">
                                  <span class="x1lliihq x6ikm8r x10wlt62 x1n2onr6 xlyipyv xuxw1ft">Tải lại trang</span>
                              </span>
                          </div>
                      </div>
                      <div class="x1ey2m1c xds687c x17qophe xg01cxk x47corl x10l6tqk x13vifvy x1ebt8du x19991ni x1dhq9h x1o1ewxj x3x9cwd x1e5q0jg x13rtm0m" role="none" data-visualcompletion="ignore"></div>
                  </div>
              </div>
          </div>
      </div>
  `;

 
  const customStyles = `
      .reload-button {
          cursor: pointer;
      }
      .support-wrapper .support-text {
           text-decoration: underline;
           cursor: help;
      }
      .dev-link {
           color: inherit;
           text-decoration: underline;
           cursor: pointer;
      }
      .qr-code {
          max-width: 100px;
          max-height: 100px;
      }
  `;

 
  const findAndReplace = (targetNode) => {
    if (!targetNode || targetNode.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }

    const potentialContainers = targetNode.matches('div[role="article"]')
      ? [targetNode]
      : targetNode.querySelectorAll('div[role="article"]');

    let replaced = false;
    for (const container of potentialContainers) {
      const heading = container.querySelector('h3 span');
      const originalButtonSpan = container.querySelector('div[role="button"][aria-label="Thử lại"] span span');
      const alreadyReplacedIcon = container.querySelector('img[alt="Facebook VNVanced icon"]');

      if (heading && heading.textContent.includes('Đã xảy ra lỗi') &&
        originalButtonSpan && originalButtonSpan.textContent.includes('Thử lại') &&
        !alreadyReplacedIcon) {
        

       
        const innerWrapper = container.querySelector('.html-div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.x6s0dn4');

        if (innerWrapper) {
         
          innerWrapper.innerHTML = newHtml;
          replaced = true;

         
          const supportWrapper = innerWrapper.querySelector('.support-wrapper');
          const qrCode = innerWrapper.querySelector('.qr-code');
          const reloadButton = innerWrapper.querySelector('.reload-button');

          if (supportWrapper && qrCode) {
            supportWrapper.addEventListener('mouseenter', () => {
              qrCode.style.display = 'block';
            });
            supportWrapper.addEventListener('mouseleave', () => {
              qrCode.style.display = 'none';
            });
          }

          if (reloadButton) {
            reloadButton.addEventListener('click', () => {
              
              window.location.reload();
            });
          }

          break;
        }
      }
    }
    return replaced;
  };

 
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          findAndReplace(node);
        }
      }
    }
  });

 
  observer.observe(document.body, { childList: true, subtree: true });

 
  const styleSheet = document.createElement("style");
  styleSheet.innerText = customStyles;
  document.head.appendChild(styleSheet);

 
  
  findAndReplace(document.body);
})();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'toggleAdBlock':
      adBlockEnabled = request.enabled;
      if (adBlockEnabled) {
        observeDOM();
        removeMatchingDivs();
      } else if (!reelsEnabled && !suggestEnabled && !commentFilterEnabled && !storyEnabled &&
        !groupPostsEnabled && !pagePostsEnabled && !postsEnabled && !newFeedsEnabled && compactUIValue === '0') {
        disconnectMainObserver();
      }
      sendResponse({ status: 'Ad block toggled' });
      break;
    case 'toggleReels':
      reelsEnabled = request.enabled;
      if (reelsEnabled) {
        observeDOM();
        removeReelsAndShortVideos();
      } else if (!adBlockEnabled && !groupPostsEnabled && !pagePostsEnabled && !postsEnabled && !suggestEnabled &&
        !commentFilterEnabled && !storyEnabled && !newFeedsEnabled && compactUIValue === '0') {
        disconnectMainObserver();
      }
      sendResponse({ status: 'Reels toggle updated' });
      break;
    case 'toggleSuggest':
      suggestEnabled = request.enabled;
      if (suggestEnabled) {
        observeDOM();
        removeSuggestions();
      } else if (!adBlockEnabled && !groupPostsEnabled && !pagePostsEnabled && !postsEnabled && !reelsEnabled &&
        !commentFilterEnabled && !storyEnabled && !newFeedsEnabled && compactUIValue === '0') {
        disconnectMainObserver();
      }
      sendResponse({ status: 'Suggest toggle updated' });
      break;
    case 'toggleGroupPosts':
      groupPostsEnabled = request.enabled;
      if (groupPostsEnabled) {
        observeDOM();
        removeGroupPosts();
      } else if (!adBlockEnabled && !pagePostsEnabled && !postsEnabled && !reelsEnabled && !commentFilterEnabled &&
        !storyEnabled && !newFeedsEnabled && compactUIValue === '0') {
        disconnectMainObserver();
      }
      sendResponse({ status: 'Groups posts toggle updated' });
      break;
    case 'togglePagePosts':
      pagePostsEnabled = request.enabled;
      if (pagePostsEnabled) {
        observeDOM();
        removePagePosts();
      } else if (!adBlockEnabled && !pagePostsEnabled && !postsEnabled && !reelsEnabled && !commentFilterEnabled &&
        !storyEnabled && !newFeedsEnabled && compactUIValue === '0') {
        disconnectMainObserver();
      }
      sendResponse({ status: 'Page posts toggle updated' });
      break;
    case 'togglePosts':
      togglePosts = request.enabled;
      if (togglePosts) {
        observeDOM();
        removePost();
      } else if (!adBlockEnabled && !pagePostsEnabled && !postsEnabled && !reelsEnabled && !commentFilterEnabled &&
        !storyEnabled && !newFeedsEnabled && compactUIValue === '0') {
        disconnectMainObserver();
      }
      sendResponse({ status: 'Posts toggle updated' });
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
  ['adBlockEnabled', 'reelsEnabled', 'suggestEnabled', 'storyEnabled', 'compactUIValue',
    'newFeedsEnabled', 'commentFilterEnabled', 'commentFilters', 'groupPostsEnabled', 'pagePostsEnabled', 'postsEnabled'],
  (data) => {
    adBlockEnabled = data.adBlockEnabled === true;
    reelsEnabled = data.reelsEnabled === true;
    storyEnabled = data.storyEnabled === true;
    newFeedsEnabled = data.newFeedsEnabled === true;
    suggestEnabled = data.suggestEnabled === true;
    commentFilterEnabled = data.commentFilterEnabled === true;
    groupPostsEnabled = data.groupPostsEnabled === true;
    pagePostsEnabled = data.pagePostsEnabled === true;
    postsEnabled = data.postsEnabled === true;

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

    if (adBlockEnabled || reelsEnabled || suggestEnabled || groupPostsEnabled || pagePostsEnabled || postsEnabled) {
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
      if (groupPostsEnabled) removeGroupPosts();
      if (pagePostsEnabled) removePagePosts();
      if (postsEnabled) removePost();
    };

    if (document.readyState === 'complete') {
      runInitialCleanup();
    } else {
      window.addEventListener("load", runInitialCleanup, { once: true });
    }

    loadRemovedCounts();
  }
);