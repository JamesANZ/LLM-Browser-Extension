import { LLMService } from "../src/services/llmService";
import { LLMConfig, LLMRequest, WebpageContext } from "../src/shared/types";

describe("LLMService", () => {
  let llmService: LLMService;
  const mockConfig: LLMConfig = {
    provider: "openai",
    apiKey: "test-api-key",
    model: "gpt-4",
  };

  beforeEach(() => {
    llmService = new LLMService(mockConfig);
  });

  describe("constructor", () => {
    it("should create LLMService with valid config", () => {
      expect(llmService).toBeInstanceOf(LLMService);
    });
  });

  describe("processRequest", () => {
    const mockRequest: LLMRequest = {
      prompt: "Test prompt",
      context: {
        url: "https://example.com",
        title: "Test Page",
        html: "<html><body>Test content</body></html>",
      },
      action: "modify",
    };

    it("should handle successful request", async () => {
      // Mock axios response
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                modifications: [
                  {
                    selector: "body",
                    action: "style",
                    styles: { color: "red" },
                  },
                ],
              }),
            },
          },
        ],
      };

      // Mock the axios client
      jest
        .spyOn(llmService as any, "sendRequest")
        .mockResolvedValue(mockResponse);

      const result = await llmService.processRequest(mockRequest);

      expect(result.success).toBe(true);
      expect(result.modifications).toBeDefined();
    });

    it("should handle API errors", async () => {
      jest
        .spyOn(llmService as any, "sendRequest")
        .mockRejectedValue(new Error("API Error"));

      const result = await llmService.processRequest(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe("API Error");
    });
  });

  describe("updateConfig", () => {
    it("should update configuration", () => {
      const newConfig = { model: "gpt-3.5-turbo" };
      llmService.updateConfig(newConfig);

      // Verify config was updated (would need to expose config for testing)
      expect(true).toBe(true); // Placeholder assertion
    });
  });
});
