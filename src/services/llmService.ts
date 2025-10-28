import axios, { AxiosInstance, AxiosResponse } from "axios";
import { LLMConfig, LLMRequest, LLMResponse } from "../shared/types";

export class LLMService {
  private config: LLMConfig;
  private client: AxiosInstance;

  constructor(config: LLMConfig) {
    this.config = config;
    this.client = this.createClient();
  }

  private createClient(): AxiosInstance {
    const baseURL = this.config.baseUrl || this.getDefaultBaseUrl();

    return axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
  }

  private getDefaultBaseUrl(): string {
    switch (this.config.provider) {
      case "openai":
        return "https://api.openai.com/v1";
      case "anthropic":
        return "https://api.anthropic.com/v1";
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  async processRequest(request: LLMRequest): Promise<LLMResponse> {
    try {
      console.log(
        "LLMService: Processing request for provider:",
        this.config.provider,
      );
      console.log("LLMService: Using model:", this.config.model);
      console.log(
        "LLMService: Base URL:",
        this.config.baseUrl || this.getDefaultBaseUrl(),
      );

      const prompt = this.buildPrompt(request);
      console.log("LLMService: Built prompt length:", prompt.length);

      const response = await this.sendRequest(prompt);
      console.log("LLMService: Received response:", response);

      const parsedResponse = this.parseResponse(response);
      console.log("LLMService: Parsed response:", parsedResponse);

      return parsedResponse;
    } catch (error) {
      console.error("LLM Service Error:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
      }
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  private buildPrompt(request: LLMRequest): string {
    const { prompt, context, action } = request;

    // Smart HTML truncation to stay within token limits
    const maxHtmlLength = 50000; // Roughly 12,500 tokens (4 chars per token)
    const truncatedHtml = this.truncateHtml(context.html, maxHtmlLength);

    let systemPrompt = `You are a web development assistant that can modify web pages. 
You will receive HTML content and user requests, and you should respond with specific DOM modifications in JSON format.

Available actions:
- modify: Change the webpage content or styling
- explain: Explain selected text or elements
- analyze: Analyze the webpage structure

Response format for modifications:
{
  "modifications": [
    {
      "selector": "CSS selector",
      "action": "replace|append|prepend|remove|style",
      "content": "new content (for replace/append/prepend)",
      "styles": {"property": "value"} (for style action),
      "attributes": {"attr": "value"} (for attribute changes)
    }
  ]
}

Current webpage context:
- URL: ${context.url}
- Title: ${context.title}
- Selected text: ${context.selectedText || "None"}
- Selected element: ${context.selectedElement ? JSON.stringify(context.selectedElement) : "None"}
- Cookies: ${context.cookies ? context.cookies.length + " cookies found" : "None"}
- Local Storage: ${context.localStorage ? Object.keys(context.localStorage).length + " items" : "None"}
- Forms: ${context.forms ? context.forms.length + " forms found" : "None"}
- Links: ${context.links ? context.links.length + " links found" : "None"}
- Images: ${context.images ? context.images.length + " images found" : "None"}
- Meta Tags: ${context.metaTags ? Object.keys(context.metaTags).length + " meta tags" : "None"}
- Viewport: ${context.viewport ? context.viewport.width + "x" + context.viewport.height : "Unknown"}`;

    if (action === "explain") {
      systemPrompt += `\n\nPlease explain the selected text or element in detail.`;
    } else if (action === "analyze") {
      systemPrompt += `\n\nPlease analyze the webpage structure and provide insights.`;
    } else {
      systemPrompt += `\n\nPlease modify the webpage according to the user's request.`;
    }

    return `${systemPrompt}\n\nUser request: ${prompt}\n\nHTML content:\n${truncatedHtml}`;
  }

  private async sendRequest(prompt: string): Promise<any> {
    const requestBody = this.buildRequestBody(prompt);
    const endpoint = this.getEndpoint();

    console.log("LLMService: Sending request to:", endpoint);
    console.log(
      "LLMService: Request body:",
      JSON.stringify(requestBody, null, 2),
    );

    try {
      const response: AxiosResponse = await this.client.post(
        endpoint,
        requestBody,
      );
      console.log("LLMService: Response status:", response.status);
      console.log("LLMService: Response data:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("LLMService: Request failed:", error);
      if (error.response) {
        console.error("LLMService: Response status:", error.response.status);
        console.error("LLMService: Response data:", error.response.data);
        throw new Error(
          `API request failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        );
      } else if (error.request) {
        console.error("LLMService: No response received:", error.request);
        throw new Error("No response received from API");
      } else {
        console.error("LLMService: Request setup error:", error.message);
        throw new Error(`Request setup error: ${error.message}`);
      }
    }
  }

  private buildRequestBody(prompt: string): any {
    switch (this.config.provider) {
      case "openai":
        return {
          model: this.config.model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 2000,
        };
      case "anthropic":
        return {
          model: this.config.model,
          max_tokens: 2000,
          messages: [{ role: "user", content: prompt }],
        };
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  private getEndpoint(): string {
    switch (this.config.provider) {
      case "openai":
        return "/chat/completions";
      case "anthropic":
        return "/messages";
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  private parseResponse(response: any): LLMResponse {
    try {
      let content = "";

      switch (this.config.provider) {
        case "openai":
          content = response.choices[0]?.message?.content || "";
          break;
        case "anthropic":
          content = response.content[0]?.text || "";
          break;
        default:
          throw new Error(`Unsupported provider: ${this.config.provider}`);
      }

      // Try to parse JSON response for modifications
      try {
        const parsed = JSON.parse(content);
        if (parsed.modifications) {
          return {
            success: true,
            content: content,
            modifications: parsed.modifications,
          };
        }
      } catch {
        // If not JSON, treat as plain text response
      }

      return {
        success: true,
        content: content,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to parse LLM response",
      };
    }
  }

  updateConfig(newConfig: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.client = this.createClient();
  }

  private truncateHtml(html: string, maxLength: number): string {
    if (html.length <= maxLength) {
      return html;
    }
    // Try to find a good breaking point (end of a tag)
    const truncated = html.substring(0, maxLength);
    const lastTagEnd = truncated.lastIndexOf(">");

    if (lastTagEnd > maxLength * 0.8) {
      // If we found a tag end close to the limit, use it
      return (
        html.substring(0, lastTagEnd + 1) +
        "\n\n[HTML content truncated due to size]"
      );
    } else {
      // Otherwise, just truncate at the limit
      return truncated + "\n\n[HTML content truncated due to size]";
    }
  }
}
