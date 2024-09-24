
// content.js
let highlightedElements = [];
let currentHighlightIndex = -1;

function highlightWords(wordsToHighlight) {
  // Clear previous highlights
  highlightedElements.forEach(el => {
    el.outerHTML = el.textContent;
  });
  highlightedElements = [];
  currentHighlightIndex = -1;

  if (!wordsToHighlight || wordsToHighlight.length === 0) {
    console.log('No words to highlight');
    return;
  }

  const regex = new RegExp(wordsToHighlight.join("|"), "gi");
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodesToReplace = [];

  while (walker.nextNode()) {
    if (regex.test(walker.currentNode.textContent)) {
      nodesToReplace.push(walker.currentNode);
    }
  }

  nodesToReplace.forEach(node => {
    const fragment = document.createDocumentFragment();
    const parts = node.textContent.split(regex);
    const matches = node.textContent.match(regex);

    parts.forEach((part, index) => {
      fragment.appendChild(document.createTextNode(part));
      if (index < matches.length) {
        const span = document.createElement("span");
        span.style.backgroundColor = "yellow";
        span.textContent = matches[index];
        fragment.appendChild(span);
        highlightedElements.push(span);
      }
    });

    node.parentNode.replaceChild(fragment, node);
  });

  console.log(`Highlighted ${highlightedElements.length} elements`);
}

function scrollToNextHighlight() {
  if (highlightedElements.length === 0) {
    console.log('No highlights to scroll to');
    return;
  }

  currentHighlightIndex = (currentHighlightIndex + 1) % highlightedElements.length;
  const element = highlightedElements[currentHighlightIndex];
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  console.log(`Scrolled to highlight ${currentHighlightIndex + 1} of ${highlightedElements.length}`);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Received message:', request);
  if (request.action === "updateHighlights") {
    chrome.storage.sync.get(['wordsToHighlight'], function(result) {
      if (chrome.runtime.lastError) {
        console.error('Error getting from storage:', chrome.runtime.lastError);
        return;
      }
      if (result.wordsToHighlight) {
        highlightWords(result.wordsToHighlight);
      } else {
        console.log('No words to highlight found in storage');
      }
    });
  } else if (request.command === "next-highlight") {
    scrollToNextHighlight();
  }
  sendResponse({status: "ok"});
});

// Initial highlight
chrome.storage.sync.get(['wordsToHighlight'], function(result) {
  if (chrome.runtime.lastError) {
    console.error('Error getting from storage:', chrome.runtime.lastError);
    return;
  }
  if (result.wordsToHighlight) {
    highlightWords(result.wordsToHighlight);
  } else {
    console.log('No words to highlight found in storage');
  }
});

console.log('Content script loaded');