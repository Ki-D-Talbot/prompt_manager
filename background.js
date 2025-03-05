chrome.runtime.onInstalled.addListener(() => {
    // Initialize storage with example prompts
    chrome.storage.local.get('prompts', (data) => {
      if (!data.prompts || data.prompts.length === 0) {
        const examplePrompts = [
          {
            id: 'example1',
            title: 'Creative Writing',
            content: 'Write a short story about [TOPIC] that includes themes of [THEME] and has a character who [CHARACTER TRAIT].',
            tags: ['writing', 'creative'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'example2',
            title: 'Code Explanation',
            content: 'Explain this code in simple terms and suggest any improvements:\n\n[CODE]',
            tags: ['programming', 'code'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        chrome.storage.local.set({ prompts: examplePrompts });
      }
    });
  });