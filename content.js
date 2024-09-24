function highlightWords(wordsToHighlight) {
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
        }
      });
  
      node.parentNode.replaceChild(fragment, node);
    });
  }
  
  chrome.storage.sync.get(['wordsToHighlight'], function(result) {
    if (result.wordsToHighlight) {
      highlightWords(result.wordsToHighlight);
    }
  });
  
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "updateHighlights") {
      location.reload();
    }
  });