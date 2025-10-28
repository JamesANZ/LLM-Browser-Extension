import { LLMConfig, Message } from "../shared/types";

class PopupController {
  private config: LLMConfig | null = null;
  private selectedText: string = "";

  constructor() {
    console.log("PopupController constructor called");
    try {
      this.init();
    } catch (error) {
      console.error("Error initializing popup:", error);
      this.showError("Failed to initialize popup");
    }
  }

  private async init(): Promise<void> {
    console.log("PopupController init started");
    try {
      console.log("Loading config...");
      await this.loadConfig();
      console.log("Setting up event listeners...");
      this.setupEventListeners();
      console.log("Setting up tabs...");
      this.setupTabs();
      console.log("Checking selected text...");
      await this.checkSelectedText();
      console.log("PopupController init completed");
    } catch (error) {
      console.error("Error in popup init:", error);
      this.showError("Failed to load popup");
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(["llmConfig"]);
      if (result.llmConfig) {
        this.config = result.llmConfig;
        this.populateConfigForm();
      }
    } catch (error) {
      console.error("Error loading config:", error);
    }
  }

  private setupEventListeners(): void {
    try {
      // Quick action buttons
      document.querySelectorAll(".quick-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const action = (e.target as HTMLElement).dataset.action;
          if (action) {
            this.handleQuickAction(action);
          }
        });
      });

      // Custom request
      const sendRequestBtn = document.getElementById("send-request");
      if (sendRequestBtn) {
        sendRequestBtn.addEventListener("click", () => {
          this.sendCustomRequest();
        });
      }

      // Settings
      const saveConfigBtn = document.getElementById("save-config");
      if (saveConfigBtn) {
        saveConfigBtn.addEventListener("click", () => {
          this.saveConfig();
        });
      }

      // Provider change
      const providerSelect = document.getElementById("provider");
      if (providerSelect) {
        providerSelect.addEventListener("change", (e) => {
          const provider = (e.target as HTMLSelectElement).value;
          const baseUrlGroup = document.getElementById("base-url-group");
          if (baseUrlGroup) {
            baseUrlGroup.style.display =
              provider === "custom" ? "block" : "none";
          }
        });
      }

      // Enter key for custom prompt
      const customPrompt = document.getElementById("custom-prompt");
      if (customPrompt) {
        customPrompt.addEventListener("keypress", (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            this.sendCustomRequest();
          }
        });
      }
    } catch (error) {
      console.error("Error setting up event listeners:", error);
    }
  }

  private setupTabs(): void {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        const tabName = (e.target as HTMLElement).dataset.tab;
        if (tabName) {
          this.switchTab(tabName);
        }
      });
    });
  }

  private switchTab(tabName: string): void {
    // Update tab buttons
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.classList.remove("active");
    });
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add("active");

    // Update tab content
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.remove("active");
    });
    document.getElementById(`${tabName}-tab`)?.classList.add("active");
  }

  private async checkSelectedText(): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab.id) {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: "GET_SELECTION",
        });
        if (response && response.text) {
          this.selectedText = response.text;
          this.showSelectedText(response.text);
        }
      }
    } catch (error) {
      // No selection or content script not ready
      console.log("No text selected or content script not ready");
    }
  }

  private showError(message: string): void {
    const container = document.querySelector(".container");
    if (container) {
      container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #dc3545;">
          <h3>Error</h3>
          <p>${message}</p>
          <button onclick="location.reload()" class="btn">Reload</button>
        </div>
      `;
    }
  }

  private showSelectedText(text: string): void {
    const container = document.getElementById("selected-text-container");
    const content = document.getElementById("selected-text-content");

    if (container && content) {
      content.textContent =
        text.length > 100 ? text.substring(0, 100) + "..." : text;
      container.style.display = "block";
    }
  }

  private handleQuickAction(action: string): void {
    if (!this.config) {
      this.showStatus("Please configure your LLM settings first", "error");
      this.switchTab("settings");
      return;
    }

    let prompt = "";
    switch (action) {
      case "change-color":
        prompt =
          "Change the color scheme of this webpage to a more modern and vibrant design";
        break;
      case "explain-text":
        if (this.selectedText) {
          prompt = `Explain this selected text: "${this.selectedText}"`;
        } else {
          prompt = "Explain the main content of this webpage";
        }
        break;
      case "summarize":
        prompt = "Provide a brief summary of this webpage";
        break;
      case "translate":
        prompt = "Translate the main content of this webpage to English";
        break;
      case "analyze-forms":
        prompt =
          "Analyze all forms on this webpage and suggest improvements for better user experience and functionality";
        break;
      case "optimize-seo":
        prompt =
          "Analyze this webpage for SEO optimization opportunities and suggest improvements to meta tags, headings, and content structure";
        break;
      case "improve-accessibility":
        prompt =
          "Analyze this webpage for accessibility issues and suggest improvements to make it more accessible for users with disabilities";
        break;
      case "analyze-performance":
        prompt =
          "Analyze this webpage for performance issues and suggest optimizations for faster loading and better user experience";
        break;
      case "test-connection":
        this.testConnection();
        return;
    }

    this.sendRequest(prompt, "modify");
  }

  private async testConnection(): Promise<void> {
    this.showLoading(true);
    this.showStatus("Testing connection...", "info");

    try {
      // First, test basic background script communication
      console.log("Testing basic background communication...");
      const pingResponse = await chrome.runtime.sendMessage({
        type: "PING",
        data: "test",
      });
      console.log("Ping response:", pingResponse);

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab.id) {
        throw new Error("No active tab found");
      }

      // Check if we're on a Chrome internal page
      if (tab.url && tab.url.startsWith("chrome://")) {
        throw new Error(
          "Cannot use extension on Chrome internal pages. Please navigate to a regular website (like google.com) and try again.",
        );
      }

      // Get page context
      console.log("Getting page context...");
      let context;
      try {
        context = await chrome.tabs.sendMessage(tab.id, {
          type: "PAGE_CONTEXT",
        });
        console.log("Page context received:", context);
      } catch (error) {
        console.log("Content script not found, injecting it...");
        // Inject content script if it's not already there
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ["content.css"],
        });

        // Wait a moment for the script to initialize
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Try again
        context = await chrome.tabs.sendMessage(tab.id, {
          type: "PAGE_CONTEXT",
        });
        console.log("Page context received after injection:", context);
      }

      // Send a simple test request
      console.log("Sending LLM request...");
      const response = await chrome.runtime.sendMessage({
        type: "LLM_REQUEST",
        data: {
          prompt: "Say 'Hello, connection test successful!'",
          context,
          action: "explain",
        },
        tabId: tab.id,
      });
      console.log("LLM response:", response);

      if (response.success) {
        this.showStatus("✅ Connection test successful!", "success");
      } else {
        this.showStatus(
          `❌ Connection test failed: ${response.error}`,
          "error",
        );
      }
    } catch (error) {
      console.error("Connection test error:", error);
      this.showStatus(
        `❌ Connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error",
      );
    } finally {
      this.showLoading(false);
    }
  }

  private sendCustomRequest(): void {
    const promptInput = document.getElementById(
      "custom-prompt",
    ) as HTMLTextAreaElement;
    const prompt = promptInput.value.trim();

    if (!prompt) {
      this.showStatus("Please enter a request", "error");
      return;
    }

    if (!this.config) {
      this.showStatus("Please configure your LLM settings first", "error");
      this.switchTab("settings");
      return;
    }

    this.sendRequest(prompt, "modify");
    promptInput.value = "";
  }

  private async sendRequest(
    prompt: string,
    action: "modify" | "explain" | "analyze",
  ): Promise<void> {
    this.showLoading(true);

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab.id) {
        throw new Error("No active tab found");
      }

      // Check if we're on a Chrome internal page
      if (tab.url && tab.url.startsWith("chrome://")) {
        throw new Error(
          "Cannot use extension on Chrome internal pages. Please navigate to a regular website (like google.com) and try again.",
        );
      }

      // Get page context
      let context;
      try {
        context = await chrome.tabs.sendMessage(tab.id, {
          type: "PAGE_CONTEXT",
        });
      } catch (error) {
        console.log("Content script not found, injecting it...");
        // Inject content script if it's not already there
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ["content.css"],
        });

        // Wait a moment for the script to initialize
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Try again
        context = await chrome.tabs.sendMessage(tab.id, {
          type: "PAGE_CONTEXT",
        });
      }

      // Send request to background script
      const response = await chrome.runtime.sendMessage({
        type: "LLM_REQUEST",
        data: {
          prompt,
          context,
          action,
        },
        tabId: tab.id,
      });

      if (response.success) {
        this.showStatus("Request processed successfully!", "success");

        // Apply modifications if any
        if (response.modifications && response.modifications.length > 0) {
          await chrome.tabs.sendMessage(tab.id, {
            type: "DOM_MODIFY",
            data: response.modifications,
          });
        }
      } else {
        this.showStatus(`Error: ${response.error}`, "error");
      }
    } catch (error) {
      console.error("Error sending request:", error);
      this.showStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error",
      );
    } finally {
      this.showLoading(false);
    }
  }

  private populateConfigForm(): void {
    if (!this.config) return;

    const providerSelect = document.getElementById(
      "provider",
    ) as HTMLSelectElement;
    const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
    const modelInput = document.getElementById("model") as HTMLInputElement;
    const baseUrlInput = document.getElementById(
      "base-url",
    ) as HTMLInputElement;

    if (providerSelect) providerSelect.value = this.config.provider;
    if (apiKeyInput) apiKeyInput.value = this.config.apiKey;
    if (modelInput) modelInput.value = this.config.model;
    if (baseUrlInput) baseUrlInput.value = this.config.baseUrl || "";

    // Show/hide base URL field
    const baseUrlGroup = document.getElementById("base-url-group");
    if (baseUrlGroup) {
      baseUrlGroup.style.display =
        this.config.provider === "custom" ? "block" : "none";
    }
  }

  private async saveConfig(): Promise<void> {
    const provider = (document.getElementById("provider") as HTMLSelectElement)
      .value;
    const apiKey = (
      document.getElementById("api-key") as HTMLInputElement
    ).value.trim();
    const model = (
      document.getElementById("model") as HTMLInputElement
    ).value.trim();
    const baseUrl = (
      document.getElementById("base-url") as HTMLInputElement
    ).value.trim();

    if (!apiKey || !model) {
      this.showStatus("Please fill in all required fields", "error");
      return;
    }

    const config: LLMConfig = {
      provider: provider as "openai" | "anthropic" | "custom",
      apiKey,
      model,
      baseUrl: baseUrl || undefined,
    };

    try {
      await chrome.storage.sync.set({ llmConfig: config });
      this.config = config;
      this.showStatus("Configuration saved successfully!", "success");

      // Close the popup after successful save
      setTimeout(() => {
        window.close();
      }, 1500);
    } catch (error) {
      console.error("Error saving config:", error);
      this.showStatus("Error saving configuration", "error");
    }
  }

  private showStatus(
    message: string,
    type: "success" | "error" | "info",
  ): void {
    const container = document.getElementById("status-container");
    if (!container) return;

    container.innerHTML = `<div class="status ${type}">${message}</div>`;

    // Auto-hide success messages
    if (type === "success") {
      setTimeout(() => {
        container.innerHTML = "";
      }, 3000);
    }
  }

  private showLoading(show: boolean): void {
    const loading = document.getElementById("loading");
    const sendButton = document.getElementById(
      "send-request",
    ) as HTMLButtonElement;

    if (loading) {
      loading.style.display = show ? "block" : "none";
    }

    if (sendButton) {
      sendButton.disabled = show;
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PopupController();
});
