let wordsToHighlight = [];

function updateWordList() {
  const wordList = document.getElementById('wordList');
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
  const newWord = document.getElementById('newWord').value.trim();
  if (newWord && !wordsToHighlight.includes(newWord)) {
    wordsToHighlight.push(newWord);
    chrome.storage.sync.set({wordsToHighlight: wordsToHighlight}, function() {
      updateWordList();
      document.getElementById('newWord').value = '';
      updateActiveTab();
    });
  }
}

function removeWord(index) {
  wordsToHighlight.splice(index, 1);
  chrome.storage.sync.set({wordsToHighlight: wordsToHighlight}, function() {
    updateWordList();
    updateActiveTab();
  });
}

function updateActiveTab() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "updateHighlights"}, function(response) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
        }
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const addButton = document.getElementById('addWord');
  if (addButton) {
    addButton.addEventListener('click', addWord);
  } else {
    console.error("Add button not found");
  }

  chrome.storage.sync.get(['wordsToHighlight'], function(result) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    if (result.wordsToHighlight) {
      wordsToHighlight = result.wordsToHighlight;
      updateWordList();
    }
  });
});