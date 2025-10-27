import { LLMService } from "../services/llmService";
import { Message, LLMConfig, LLMRequest, LLMResponse } from "../shared/types";

class BackgroundService {
  private llmService: LLMService | null = null;

  constructor() {
    console.log("BackgroundService constructor called");
    this.init();
  }

  private init(): void {
    console.log("BackgroundService init started");
    this.setupMessageListener();
    this.loadConfig();
    console.log("BackgroundService init completed");
  }

  private async loadConfig(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(["llmConfig"]);
      if (result.llmConfig) {
        this.llmService = new LLMService(result.llmConfig);
      }
    } catch (error) {
      console.error("Error loading config in background:", error);
    }
  }

  private setupMessageListener(): void {
    console.log("Setting up message listener");
    chrome.runtime.onMessage.addListener(
      (message: Message, sender, sendResponse) => {
        console.log("Background received message:", message.type);
        this.handleMessage(message, sender, sendResponse);
        return true; // Keep message channel open for async response
      },
    );

    // Listen for config changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === "sync" && changes.llmConfig) {
        console.log("Config changed, reloading...");
        this.loadConfig();
      }
    });
  }

  private async handleMessage(
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ): Promise<void> {
    try {
      switch (message.type) {
        case "LLM_REQUEST":
          await this.handleLLMRequest(message, sendResponse);
          break;
        case "SELECTION_MADE":
          this.handleSelectionMade(message, sender);
          break;
        default:
          console.log("Unknown message type:", message.type);
      }
    } catch (error) {
      console.error("Error handling message:", error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private async handleLLMRequest(
    message: Message,
    sendResponse: (response: LLMResponse) => void,
  ): Promise<void> {
    console.log("Handling LLM request");
    if (!this.llmService) {
      console.log("LLM service not configured");
      sendResponse({
        success: false,
        error:
          "LLM service not configured. Please set up your API key in the extension popup.",
      });
      return;
    }

    console.log("Processing LLM request with service");
    const request: LLMRequest = message.data;
    const response = await this.llmService.processRequest(request);
    console.log("LLM request processed, sending response:", response.success);
    sendResponse(response);
  }

  private handleSelectionMade(
    message: Message,
    sender: chrome.runtime.MessageSender,
  ): void {
    // Store selection info for popup to access
    chrome.storage.local.set({
      lastSelection: {
        text: message.data.text,
        timestamp: Date.now(),
        tabId: sender.tab?.id,
      },
    });
  }
}

// Initialize background service
console.log("Initializing BackgroundService...");
try {
  new BackgroundService();
  console.log("BackgroundService initialized successfully");
} catch (error) {
  console.error("Failed to initialize BackgroundService:", error);
}
