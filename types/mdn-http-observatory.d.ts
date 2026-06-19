declare module "@mdn/mdn-http-observatory/src/site.js" {
  export class Site {
    hostname: string;
    port?: number;
    path?: string;
    constructor(hostname: string, port?: number, path?: string);
    static fromSiteString(siteString: string): Site;
    asSiteKey(): string;
  }
}

declare module "@mdn/mdn-http-observatory/src/retriever/retriever.js" {
  export function retrieve(site: any, options?: any): Promise<any>;
}

declare module "@mdn/mdn-http-observatory/src/scanner/index.js" {
  export function analyzeScan(requests: any): any;
  export function scan(site: any, options?: any): Promise<any>;
}
