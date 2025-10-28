import {
  Message,
  WebpageContext,
  SelectionInfo,
  DOMModification,
} from "../shared/types";
import { ContextAnalyzer } from "../services/contextAnalyzer";
import "./content.css";

class ContentScript {
  private isActive = false;
  private selectedElement: Element | null = null;
  private selectedText = "";
  private overlay: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.setupMessageListener();
    this.setupSelectionHandler();
    this.createFloatingButton();
  }

  private setupMessageListener(): void {
    console.log("Content script: Setting up message listener");
    chrome.runtime.onMessage.addListener(
      (message: Message, sender, sendResponse) => {
        console.log("=== CONTENT SCRIPT RECEIVED MESSAGE ===");
        console.log("Content script: Message type:", message.type);
        console.log("Content script: Message data:", message.data);

        switch (message.type) {
          case "PAGE_CONTEXT":
            console.log("Content script: Handling PAGE_CONTEXT request");
            this.getPageContext().then((context) => {
              console.log("Content script: Sending context response:", context);
              sendResponse(context);
            });
            return true; // Keep message channel open for async response
          case "DOM_MODIFY":
            console.log("Content script: Handling DOM_MODIFY request");
            this.applyModifications(message.data);
            sendResponse({ success: true });
            break;
          default:
            console.log("Content script: Unknown message type:", message.type);
            break;
        }
      },
    );
  }

  private setupSelectionHandler(): void {
    document.addEventListener("mouseup", () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        this.selectedText = selection.toString().trim();
        this.selectedElement = selection.anchorNode?.parentElement || null;
        this.showSelectionOverlay();
      }
    });

    document.addEventListener("click", (e) => {
      if (e.target !== this.overlay) {
        this.hideSelectionOverlay();
      }
    });
  }

  private createFloatingButton(): void {
    const button = document.createElement("div");
    button.id = "llm-extension-button";
    button.innerHTML = "🤖";
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: #007bff;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
    `;

    button.addEventListener("mouseenter", () => {
      button.style.transform = "scale(1.1)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "scale(1)";
    });

    button.addEventListener("click", () => {
      this.toggleExtension();
    });

    document.body.appendChild(button);
  }

  private toggleExtension(): void {
    this.isActive = !this.isActive;
    const button = document.getElementById("llm-extension-button");
    if (button) {
      button.style.background = this.isActive ? "#28a745" : "#007bff";
    }

    if (this.isActive) {
      this.showInstructions();
    } else {
      this.hideInstructions();
    }
  }

  private showInstructions(): void {
    const instructions = document.createElement("div");
    instructions.id = "llm-instructions";
    instructions.innerHTML = `
      <div style="
        position: fixed;
        top: 80px;
        right: 20px;
        background: white;
        border: 2px solid #007bff;
        border-radius: 8px;
        padding: 15px;
        max-width: 300px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10001;
        font-family: Arial, sans-serif;
        font-size: 14px;
      ">
        <h3 style="margin: 0 0 10px 0; color: #007bff;">LLM Extension Active</h3>
        <p style="margin: 5px 0;">• Select text to modify or explain</p>
        <p style="margin: 5px 0;">• Click the popup to send requests</p>
        <p style="margin: 5px 0;">• The AI will modify this page</p>
        <button id="close-instructions" style="
          background: #dc3545;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 10px;
        ">Close</button>
      </div>
    `;

    document.body.appendChild(instructions);

    document
      .getElementById("close-instructions")
      ?.addEventListener("click", () => {
        this.hideInstructions();
      });
  }

  private hideInstructions(): void {
    const instructions = document.getElementById("llm-instructions");
    if (instructions) {
      instructions.remove();
    }
    this.isActive = false;
    const button = document.getElementById("llm-extension-button");
    if (button) {
      button.style.background = "#007bff";
    }
  }

  private showSelectionOverlay(): void {
    if (!this.selectedElement) return;

    this.hideSelectionOverlay();

    const rect = this.selectedElement.getBoundingClientRect();
    const overlay = document.createElement("div");
    overlay.id = "llm-selection-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: ${rect.top - 40}px;
      left: ${rect.left}px;
      background: #007bff;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10002;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    overlay.textContent = "Selected: Click to use with LLM";

    overlay.addEventListener("click", () => {
      this.sendSelectionToPopup();
    });

    document.body.appendChild(overlay);
    this.overlay = overlay;
  }

  private hideSelectionOverlay(): void {
    const overlay = document.getElementById("llm-selection-overlay");
    if (overlay) {
      overlay.remove();
    }
    this.overlay = null;
  }

  private sendSelectionToPopup(): void {
    const selectionInfo: SelectionInfo = {
      text: this.selectedText,
      element: this.selectedElement!,
      rect: this.selectedElement!.getBoundingClientRect(),
    };

    chrome.runtime.sendMessage({
      type: "SELECTION_MADE",
      data: selectionInfo,
    });
  }

  private async getPageContext(): Promise<WebpageContext> {
    console.log("Content script: Starting getPageContext");
    const context = await ContextAnalyzer.analyzePage();
    console.log("Content script: Context analyzed, adding selection");

    // Add selected text and element
    context.selectedText = ContextAnalyzer.getSelectedText();
    context.selectedElement = ContextAnalyzer.getSelectedElement();

    console.log("Content script: getPageContext completed");
    return context;
  }

  private applyModifications(modifications: DOMModification[]): void {
    modifications.forEach((mod) => {
      try {
        const elements = document.querySelectorAll(mod.selector);

        elements.forEach((element) => {
          switch (mod.action) {
            case "replace":
              if (mod.content !== undefined) {
                element.innerHTML = mod.content;
              }
              break;
            case "append":
              if (mod.content !== undefined) {
                element.innerHTML += mod.content;
              }
              break;
            case "prepend":
              if (mod.content !== undefined) {
                element.innerHTML = mod.content + element.innerHTML;
              }
              break;
            case "remove":
              element.remove();
              break;
            case "style":
              if (mod.styles) {
                Object.assign((element as HTMLElement).style, mod.styles);
              }
              if (mod.attributes) {
                Object.entries(mod.attributes).forEach(([key, value]) => {
                  element.setAttribute(key, value);
                });
              }
              break;
          }
        });
      } catch (error) {
        console.error("Error applying modification:", error);
      }
    });

    // Show success notification
    this.showNotification("Page modified successfully!", "success");
  }

  private showNotification(message: string, type: "success" | "error"): void {
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === "success" ? "#28a745" : "#dc3545"};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10003;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize the content script
new ContentScript();
