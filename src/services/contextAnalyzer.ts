import {
  WebpageContext,
  FormData,
  FormFieldData,
  LinkData,
  ImageData,
  ScriptData,
  StylesheetData,
} from "../shared/types";

export class ContextAnalyzer {
  static async analyzePage(): Promise<WebpageContext> {
    const context: WebpageContext = {
      url: window.location.href,
      title: document.title,
      html: document.documentElement.outerHTML,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };

    try {
      // Get cookies
      context.cookies = await this.getCookies();

      // Get storage data
      context.localStorage = this.getLocalStorage();
      context.sessionStorage = this.getSessionStorage();

      // Get meta tags
      context.metaTags = this.getMetaTags();

      // Get forms
      context.forms = this.getForms();

      // Get links
      context.links = this.getLinks();

      // Get images
      context.images = this.getImages();

      // Get scripts
      context.scripts = this.getScripts();

      // Get stylesheets
      context.stylesheets = this.getStylesheets();

      // Get page metrics
      context.pageMetrics = this.getPageMetrics();
    } catch (error) {
      console.error("Error analyzing page context:", error);
      // Return basic context even if analysis fails
    }

    return context;
  }

  private static async getCookies(): Promise<chrome.cookies.Cookie[]> {
    return new Promise((resolve) => {
      try {
        chrome.cookies.getAll(
          { domain: window.location.hostname },
          (cookies) => {
            resolve(cookies || []);
          },
        );
      } catch (error) {
        console.error("Error getting cookies:", error);
        resolve([]);
      }
    });
  }

  private static getLocalStorage(): Record<string, string> {
    const storage: Record<string, string> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          storage[key] = localStorage.getItem(key) || "";
        }
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
    return storage;
  }

  private static getSessionStorage(): Record<string, string> {
    const storage: Record<string, string> = {};
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          storage[key] = sessionStorage.getItem(key) || "";
        }
      }
    } catch (error) {
      console.error("Error accessing sessionStorage:", error);
    }
    return storage;
  }

  private static getMetaTags(): Record<string, string> {
    const metaTags: Record<string, string> = {};
    const metaElements = document.querySelectorAll("meta");

    metaElements.forEach((meta) => {
      const name =
        meta.getAttribute("name") ||
        meta.getAttribute("property") ||
        meta.getAttribute("http-equiv");
      const content = meta.getAttribute("content");
      if (name && content) {
        metaTags[name] = content;
      }
    });

    return metaTags;
  }

  private static getForms(): FormData[] {
    const forms: FormData[] = [];
    const formElements = document.querySelectorAll("form");

    formElements.forEach((form) => {
      const formData: FormData = {
        id: form.id || undefined,
        className: form.className || undefined,
        action: form.action || undefined,
        method: form.method || undefined,
        fields: [],
      };

      const inputs = form.querySelectorAll("input, textarea, select");
      inputs.forEach((input) => {
        const field: FormFieldData = {
          name: input.getAttribute("name") || undefined,
          type: input.getAttribute("type") || input.tagName.toLowerCase(),
          value: (input as HTMLInputElement).value || undefined,
          placeholder: input.getAttribute("placeholder") || undefined,
          required: input.hasAttribute("required"),
        };
        formData.fields.push(field);
      });

      forms.push(formData);
    });

    return forms;
  }

  private static getLinks(): LinkData[] {
    const links: LinkData[] = [];
    const linkElements = document.querySelectorAll("a[href]");

    linkElements.forEach((link) => {
      const linkData: LinkData = {
        href: link.getAttribute("href") || "",
        text: link.textContent?.trim() || "",
        target: link.getAttribute("target") || undefined,
        rel: link.getAttribute("rel") || undefined,
      };
      links.push(linkData);
    });

    return links;
  }

  private static getImages(): ImageData[] {
    const images: ImageData[] = [];
    const imgElements = document.querySelectorAll("img");

    imgElements.forEach((img) => {
      const imageData: ImageData = {
        src: img.src || "",
        alt: img.alt || undefined,
        width: img.naturalWidth || undefined,
        height: img.naturalHeight || undefined,
      };
      images.push(imageData);
    });

    return images;
  }

  private static getScripts(): ScriptData[] {
    const scripts: ScriptData[] = [];
    const scriptElements = document.querySelectorAll("script");

    scriptElements.forEach((script) => {
      const scriptData: ScriptData = {
        src: script.src || undefined,
        type: script.type || undefined,
        content: script.src
          ? undefined
          : script.textContent?.substring(0, 1000) || undefined, // Limit inline script content
      };
      scripts.push(scriptData);
    });

    return scripts;
  }

  private static getStylesheets(): StylesheetData[] {
    const stylesheets: StylesheetData[] = [];
    const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
    const styleElements = document.querySelectorAll("style");

    linkElements.forEach((link) => {
      const stylesheetData: StylesheetData = {
        href: link.getAttribute("href") || undefined,
        media: link.getAttribute("media") || undefined,
      };
      stylesheets.push(stylesheetData);
    });

    styleElements.forEach((style) => {
      const stylesheetData: StylesheetData = {
        content: style.textContent?.substring(0, 1000) || undefined, // Limit inline style content
      };
      stylesheets.push(stylesheetData);
    });

    return stylesheets;
  }

  private static getPageMetrics(): WebpageContext["pageMetrics"] {
    const metrics: WebpageContext["pageMetrics"] = {
      loadTime: performance.now(),
      domContentLoaded: 0,
    };

    try {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        metrics.domContentLoaded =
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart;
        metrics.firstPaint =
          navigation.loadEventEnd - navigation.loadEventStart;
      }
    } catch (error) {
      console.error("Error getting page metrics:", error);
    }

    return metrics;
  }

  static getSelectedElement(): WebpageContext["selectedElement"] {
    const selection = window.getSelection();
    if (selection && selection.anchorNode) {
      const element = selection.anchorNode.parentElement;
      if (element) {
        return {
          tagName: element.tagName,
          className: element.className,
          id: element.id,
          textContent: element.textContent || "",
          outerHTML: element.outerHTML,
        };
      }
    }
    return undefined;
  }

  static getSelectedText(): string {
    const selection = window.getSelection();
    return selection ? selection.toString().trim() : "";
  }
}
