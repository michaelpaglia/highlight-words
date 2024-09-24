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

function updateActiveTab(retryCount = 0) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (chrome.runtime.lastError) {
      console.error('Error querying tabs:', chrome.runtime.lastError);
      return;
    }
    if (tabs[0]) {
      console.log('Sending updateHighlights message to tab:', tabs[0].id);
      chrome.tabs.sendMessage(tabs[0].id, {action: "updateHighlights"}, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Error sending message to tab:', chrome.runtime.lastError);
          if (retryCount < 3) {
            console.log(`Retrying... Attempt ${retryCount + 1}`);
            setTimeout(() => updateActiveTab(retryCount + 1), 1000);
          } else {
            console.error('Failed to send message after 3 attempts');
          }
        } else {
          console.log('Message sent successfully, response:', response);
        }
      });
    } else {
      console.error('No active tab found');
    }
  });
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