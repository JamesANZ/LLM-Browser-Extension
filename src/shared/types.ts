export interface LLMConfig {
  apiKey: string;
  provider: "openai" | "anthropic" | "custom";
  model: string;
  baseUrl?: string;
}

export interface WebpageContext {
  url: string;
  title: string;
  html: string;
  selectedText?: string;
  selectedElement?: {
    tagName: string;
    className: string;
    id: string;
    textContent: string;
    outerHTML: string;
  };
  cookies?: chrome.cookies.Cookie[];
  localStorage?: Record<string, string>;
  sessionStorage?: Record<string, string>;
  metaTags?: Record<string, string>;
  forms?: FormData[];
  links?: LinkData[];
  images?: ImageData[];
  scripts?: ScriptData[];
  stylesheets?: StylesheetData[];
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  pageMetrics?: {
    loadTime: number;
    domContentLoaded: number;
    firstPaint?: number;
  };
}

export interface FormData {
  id?: string;
  className?: string;
  action?: string;
  method?: string;
  fields: FormFieldData[];
}

export interface FormFieldData {
  name?: string;
  type?: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
}

export interface LinkData {
  href: string;
  text: string;
  target?: string;
  rel?: string;
}

export interface ImageData {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface ScriptData {
  src?: string;
  type?: string;
  content?: string;
}

export interface StylesheetData {
  href?: string;
  media?: string;
  content?: string;
}

export interface LLMRequest {
  prompt: string;
  context: WebpageContext;
  action: "modify" | "explain" | "analyze";
}

export interface LLMResponse {
  success: boolean;
  content?: string;
  error?: string;
  modifications?: DOMModification[];
}

export interface DOMModification {
  selector: string;
  action: "replace" | "append" | "prepend" | "remove" | "style";
  content?: string;
  styles?: Record<string, string>;
  attributes?: Record<string, string>;
}

export interface Message {
  type:
    | "PING"
    | "PONG"
    | "LLM_REQUEST"
    | "LLM_RESPONSE"
    | "PAGE_CONTEXT"
    | "DOM_MODIFY"
    | "ERROR"
    | "SELECTION_MADE"
    | "GET_SELECTION";
  data: any;
  tabId?: number;
}

export interface SelectionInfo {
  text: string;
  element: Element;
  rect: DOMRect;
}
