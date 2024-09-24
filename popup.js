// popup.js
let wordsToHighlight = [];

function updateWordList() {
  const wordList = document.getElementById('wordList');
  if (!wordList) {
    console.error('Word list element not found');
    return;
  }
  wordList.innerHTML = '';
  wordsToHighlight.forEach((word, index) => {
    const li = document.createElement('li');
    const wordSpan = document.createElement('span');
    wordSpan.textContent = word;
    li.appendChild(wordSpan);
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.onclick = () => removeWord(index);
    li.appendChild(removeButton);
    wordList.appendChild(li);
  });
}

function addWord() {
  const newWordInput = document.getElementById('newWord');
  if (!newWordInput) {
    console.error('New word input element not found');
    return;
  }
  const newWord = newWordInput.value.trim();
  if (newWord && !wordsToHighlight.includes(newWord)) {
    wordsToHighlight.push(newWord);
    chrome.storage.sync.set({wordsToHighlight: wordsToHighlight}, function() {
      if (chrome.runtime.lastError) {
        console.error('Error saving to storage:', chrome.runtime.lastError);
        return;
      }
      console.log('Words saved to storage:', wordsToHighlight);
      updateWordList();
      newWordInput.value = '';
      updateActiveTab();
    });
  }
}

function removeWord(index) {
  wordsToHighlight.splice(index, 1);
  chrome.storage.sync.set({wordsToHighlight: wordsToHighlight}, function() {
    if (chrome.runtime.lastError) {
      console.error('Error saving to storage:', chrome.runtime.lastError);
      return;
    }
    console.log('Words saved to storage after removal:', wordsToHighlight);
    updateWordList();
    updateActiveTab();
  });
}

async function updateActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tab) {
      console.error('No active tab found');
      return;
    }

    await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: highlightWordsInPage,
      args: [wordsToHighlight],
    });

    console.log('Highlighting script executed successfully');
  } catch (error) {
    console.error('Error executing script:', error);
  }
}

// This function will be injected into the page
function highlightWordsInPage(wordsToHighlight) {
  console.log('Highlighting words:', wordsToHighlight);

  // Clear previous highlights
  const previousHighlights = document.querySelectorAll('span.extension-highlight');
  previousHighlights.forEach(el => {
    el.outerHTML = el.textContent;
  });

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
        span.className = 'extension-highlight';
        span.style.backgroundColor = "yellow";
        span.textContent = matches[index];
        fragment.appendChild(span);
      }
    });

    node.parentNode.replaceChild(fragment, node);
  });

  console.log(`Highlighted ${nodesToReplace.length} text nodes`);
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup DOM loaded');
  const addButton = document.getElementById('addWord');
  if (addButton) {
    addButton.addEventListener('click', addWord);
  } else {
    console.error("Add button not found");
  }

  chrome.storage.sync.get(['wordsToHighlight'], function(result) {
    if (chrome.runtime.lastError) {
      console.error('Error getting from storage:', chrome.runtime.lastError);
      return;
    }
    if (result.wordsToHighlight) {
      wordsToHighlight = result.wordsToHighlight;
      console.log('Words loaded from storage:', wordsToHighlight);
      updateWordList();
      updateActiveTab();  // Update highlights when popup opens
    } else {
      console.log('No words found in storage');
    }
  });
});