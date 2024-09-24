chrome.commands.onCommand.addListener((command) => {
    if (command === "next-highlight") {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {command: "next-highlight"});
        }
      });
    }
  });