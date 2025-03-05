document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const promptList = document.getElementById('promptList');
  const newPromptBtn = document.getElementById('newPrompt');
  const importBtn = document.getElementById('importBtn');
  const exportBtn = document.getElementById('exportBtn');
  const searchInput = document.getElementById('searchInput');
  const tagFilter = document.getElementById('tagFilter');
  const promptModal = document.getElementById('promptModal');
  const modalClose = document.querySelector('.close');
  const promptForm = document.getElementById('promptForm');
  const modalTitle = document.getElementById('modalTitle');
  const promptTitle = document.getElementById('promptTitle');
  const promptContent = document.getElementById('promptContent');
  const promptTags = document.getElementById('promptTags');
  const cancelBtn = document.getElementById('cancelBtn');
  const fileInput = document.getElementById('fileInput');
  const themeToggle = document.getElementById('themeToggle');

  // State
  let prompts = [];
  let editingPromptId = null;
  let allTags = new Set();

  // Load prompts from storage
  const loadPrompts = () => {
    chrome.storage.local.get('prompts', (data) => {
      prompts = data.prompts || [];
      updateTagFilter();
      renderPromptList();
    });
  };

  // Save prompts to storage
  const savePrompts = () => {
    chrome.storage.local.set({ prompts }, () => {
      updateTagFilter();
      renderPromptList();
    });
  };

  // Update tag filter dropdown
  const updateTagFilter = () => {
    allTags = new Set();
    prompts.forEach(prompt => {
      prompt.tags.forEach(tag => allTags.add(tag));
    });
    
    // Clear existing options except the first one
    while (tagFilter.options.length > 1) {
      tagFilter.remove(1);
    }
    
    // Add tags to filter
    [...allTags].sort().forEach(tag => {
      const option = document.createElement('option');
      option.value = tag;
      option.textContent = tag;
      tagFilter.appendChild(option);
    });
  };

  // Render the prompt list
  const renderPromptList = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedTag = tagFilter.value;
    
    // Filter prompts
    const filteredPrompts = prompts.filter(prompt => {
      const matchesSearch = 
        prompt.title.toLowerCase().includes(searchTerm) || 
        prompt.content.toLowerCase().includes(searchTerm);
      
      const matchesTag = 
        selectedTag === '' || 
        prompt.tags.includes(selectedTag);
      
      return matchesSearch && matchesTag;
    });
    
    // Clear list
    promptList.innerHTML = '';
    
    // Render filtered prompts
    if (filteredPrompts.length === 0) {
      promptList.innerHTML = '<div class="no-prompts">No prompts found.</div>';
    } else {
      filteredPrompts.forEach(prompt => {
        const promptItem = document.createElement('div');
        promptItem.className = 'prompt-item';
        promptItem.innerHTML = `
          <div class="prompt-header">
            <div class="prompt-title">${prompt.title}</div>
            <div class="prompt-actions">
              <button class="prompt-action copy" data-id="${prompt.id}">Copy</button>
              <button class="prompt-action edit" data-id="${prompt.id}">Edit</button>
              <button class="prompt-action delete" data-id="${prompt.id}">Delete</button>
            </div>
          </div>
          <div class="prompt-content">${prompt.content}</div>
          <div class="prompt-tags">
            ${prompt.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        `;
        promptList.appendChild(promptItem);
      });
      
      // Add event listeners to action buttons
      document.querySelectorAll('.prompt-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          
          if (btn.classList.contains('copy')) {
            copyPrompt(id);
          } else if (btn.classList.contains('edit')) {
            editPrompt(id);
          } else if (btn.classList.contains('delete')) {
            deletePrompt(id);
          }
        });
      });
      
      // Add click event to prompt items to view/copy
      document.querySelectorAll('.prompt-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (!e.target.classList.contains('prompt-action')) {
            const id = item.querySelector('.prompt-action').getAttribute('data-id');
            viewPrompt(id);
          }
        });
      });
    }
  };

  // Open modal to create a new prompt
  const openNewPromptModal = () => {
    modalTitle.textContent = 'New Prompt';
    promptTitle.value = '';
    promptContent.value = '';
    promptTags.value = '';
    editingPromptId = null;
    promptModal.style.display = 'block';
  };

  // Copy prompt to clipboard
  const copyPrompt = (id) => {
    const prompt = prompts.find(p => p.id === id);
    if (prompt) {
      navigator.clipboard.writeText(prompt.content)
        .then(() => {
          // Show a brief success message
          const btn = document.querySelector(`.copy[data-id="${id}"]`);
          const originalText = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => {
            btn.textContent = originalText;
          }, 1500);
        });
    }
  };

  // View prompt details
  const viewPrompt = (id) => {
    const prompt = prompts.find(p => p.id === id);
    if (prompt) {
      promptTitle.value = prompt.title;
      promptContent.value = prompt.content;
      promptTags.value = prompt.tags.join(', ');
      modalTitle.textContent = 'View Prompt';
      editingPromptId = id;
      promptModal.style.display = 'block';
    }
  };

  // Edit prompt
  const editPrompt = (id) => {
    const prompt = prompts.find(p => p.id === id);
    if (prompt) {
      promptTitle.value = prompt.title;
      promptContent.value = prompt.content;
      promptTags.value = prompt.tags.join(', ');
      modalTitle.textContent = 'Edit Prompt';
      editingPromptId = id;
      promptModal.style.display = 'block';
    }
  };

  // Delete prompt
  const deletePrompt = (id) => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      prompts = prompts.filter(p => p.id !== id);
      savePrompts();
    }
  };

  // Generate a unique ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Export prompts
  const exportPrompts = () => {
    const data = JSON.stringify(prompts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
      url: url,
      filename: `prompt-library-${new Date().toISOString().split('T')[0]}.json`,
      saveAs: true
    });
  };

  // Import prompts
  const importPrompts = () => {
    fileInput.click();
  };

  // Event Listeners
  newPromptBtn.addEventListener('click', openNewPromptModal);
  
  modalClose.addEventListener('click', () => {
    promptModal.style.display = 'none';
  });
  
  cancelBtn.addEventListener('click', () => {
    promptModal.style.display = 'none';
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === promptModal) {
      promptModal.style.display = 'none';
    }
  });
  
  promptForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = promptTitle.value.trim();
    const content = promptContent.value.trim();
    const tags = promptTags.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');
    
    if (editingPromptId) {
      // Edit existing prompt
      const index = prompts.findIndex(p => p.id === editingPromptId);
      if (index !== -1) {
        prompts[index] = {
          ...prompts[index],
          title,
          content,
          tags,
          updatedAt: new Date().toISOString()
        };
      }
    } else {
      // Create new prompt
      prompts.push({
        id: generateId(),
        title,
        content,
        tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    savePrompts();
    promptModal.style.display = 'none';
  });
  
  searchInput.addEventListener('input', renderPromptList);
  
  tagFilter.addEventListener('change', renderPromptList);
  
  importBtn.addEventListener('click', importPrompts);
  
  exportBtn.addEventListener('click', exportPrompts);
  
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedPrompts = JSON.parse(event.target.result);
          if (Array.isArray(importedPrompts)) {
            if (confirm(`Import ${importedPrompts.length} prompts? This will merge with your existing library.`)) {
              // Merge imported prompts with existing ones, avoiding duplicates by ID
              const existingIds = new Set(prompts.map(p => p.id));
              const newPrompts = importedPrompts.filter(p => !existingIds.has(p.id));
              prompts = [...prompts, ...newPrompts];
              savePrompts();
              alert(`Successfully imported ${newPrompts.length} prompts!`);
            }
          } else {
            alert('Invalid format. Import file should contain an array of prompts.');
          }
        } catch (error) {
          alert('Error parsing import file. Make sure it\'s a valid JSON file.');
        }
        fileInput.value = '';
      };
      reader.readAsText(file);
    }
  });

  // Theme handling
  const initTheme = () => {
    // Check for saved theme preference or use system preference
    chrome.storage.local.get('darkMode', (data) => {
      const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDarkMode = data.darkMode !== undefined ? data.darkMode : prefersDarkScheme;
      
      document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
      themeToggle.checked = isDarkMode;
    });
  };
  
  // Toggle theme
  themeToggle.addEventListener('change', () => {
    const isDarkMode = themeToggle.checked;
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    chrome.storage.local.set({ darkMode: isDarkMode });
  });
  
  // Initial load
  loadPrompts();
  initTheme();
});