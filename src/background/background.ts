import { LLMService } from "../services/llmService";
import { Message, LLMConfig, LLMRequest, LLMResponse } from "../shared/types";

class BackgroundService {
  private llmService: LLMService | null = null;

  constructor() {
    console.log("BackgroundService constructor called");
    this.init();
  }

  private async init(): Promise<void> {
    console.log("BackgroundService init started");
    this.setupMessageListener();
    await this.loadConfig();
    console.log("BackgroundService init completed");
  }

  private async loadConfig(): Promise<void> {
    try {
      console.log("Background: Loading config from storage...");
      const result = await chrome.storage.sync.get(["llmConfig"]);
      console.log("Background: Storage result:", result);

      if (result.llmConfig) {
        console.log("Background: Config found, creating LLM service...");
        console.log("Background: Config details:", {
          provider: result.llmConfig.provider,
          model: result.llmConfig.model,
          hasApiKey: !!result.llmConfig.apiKey,
          baseUrl: result.llmConfig.baseUrl,
        });

        this.llmService = new LLMService(result.llmConfig);
        console.log("Background: LLM service created successfully");
      } else {
        console.log("Background: No config found in storage");
      }
    } catch (error) {
      console.error("Error loading config in background:", error);
    }
  }

  private setupMessageListener(): void {
    console.log("Setting up message listener");
    chrome.runtime.onMessage.addListener(
      (message: Message, sender, sendResponse) => {
        console.log("=== BACKGROUND RECEIVED MESSAGE ===");
        console.log("Message type:", message.type);
        console.log("Message data:", message.data);
        console.log("Sender:", sender);

        this.handleMessage(message, sender, sendResponse);
        return true; // Keep message channel open for async response
      },
    );

    // Listen for config changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      console.log("Storage changed:", { changes, namespace });
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
        case "PING":
          console.log("Received PING, sending PONG");
          sendResponse({ type: "PONG", data: "pong" });
          break;
        case "LLM_REQUEST":
          await this.handleLLMRequest(message, sendResponse);
          break;
        case "SELECTION_MADE":
          this.handleSelectionMade(message, sender);
          break;
        default:
          console.log("Unknown message type:", message.type);
          sendResponse({ error: "Unknown message type" });
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

new BackgroundService();
