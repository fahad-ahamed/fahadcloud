// Web Search Integration for AI Agent
// Allows the AI to search the web for real-time information

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}

export class WebSearchEngine {
  /**
   * Search the web for real-time information
   * Uses multiple free search APIs as fallbacks
   */
  static async search(query: string, maxResults: number = 5): Promise<WebSearchResult[]> {
    const results: WebSearchResult[] = [];
    
    try {
      // DuckDuckGo instant answer API (free, no key required)
      const ddgResponse = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
        { 
          headers: { "User-Agent": "FahadCloud-AI-Agent/6.0" },
          signal: AbortSignal.timeout(5000)
        }
      );
      
      if (ddgResponse.ok) {
        const data = await ddgResponse.json();
        if (data.Abstract) {
          results.push({
            title: data.Heading || query,
            url: data.AbstractURL || "",
            snippet: data.Abstract,
            relevance: 0.9,
          });
        }
        if (data.RelatedTopics) {
          for (const topic of data.RelatedTopics.slice(0, maxResults)) {
            if (topic.Text && topic.FirstURL) {
              results.push({
                title: topic.Text.split(" - ")[0] || query,
                url: topic.FirstURL,
                snippet: topic.Text,
                relevance: 0.7,
              });
            }
          }
        }
      }
    } catch (e) {
      console.error("DuckDuckGo search failed:", e);
    }

    // Fallback: Use built-in knowledge for common queries
    if (results.length === 0) {
      return this.knowledgeFallback(query);
    }

    return results.slice(0, maxResults);
  }

  /**
   * Knowledge base fallback for common technical queries
   */
  private static knowledgeFallback(query: string): WebSearchResult[] {
    const lower = query.toLowerCase();
    
    // Cloud/Hosting knowledge
    const knowledge: Record<string, WebSearchResult> = {
      "dns": {
        title: "DNS Management Guide",
        url: "internal://knowledge/dns",
        snippet: "DNS (Domain Name System) translates domain names to IP addresses. Common records: A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail), TXT (text), NS (nameserver). TTL determines caching duration. propagation takes 24-48 hours.",
        relevance: 0.8,
      },
      "ssl": {
        title: "SSL/TLS Certificate Guide",
        url: "internal://knowledge/ssl",
        snippet: "SSL/TLS encrypts data between client and server. Types: DV (domain validated), OV (organization), EV (extended). Free options: Let's Encrypt, Cloudflare. Certificate validity: 90 days (Let's Encrypt) to 1 year.",
        relevance: 0.8,
      },
      "hosting": {
        title: "Web Hosting Guide",
        url: "internal://knowledge/hosting",
        snippet: "Hosting types: Shared (budget), VPS (dedicated resources), Dedicated (full server), Cloud (scalable). Server requirements depend on traffic, tech stack, and storage needs. Recommended: Node.js + PM2 for production.",
        relevance: 0.8,
      },
      "domain": {
        title: "Domain Registration Guide",
        url: "internal://knowledge/domains",
        snippet: "Domain name is your website address. Popular TLDs: .com, .net, .org, .io, .dev. Registration requires: available name, registrant info, payment. DNS configuration needed after registration. Auto-renewal recommended.",
        relevance: 0.8,
      },
      "deploy": {
        title: "Deployment Guide",
        url: "internal://knowledge/deploy",
        snippet: "Deployment process: build code, transfer to server, configure web server, test, go live. Best practices: use CI/CD, staging environment, rollback plan, monitoring. PM2 for Node.js process management.",
        relevance: 0.8,
      },
      "security": {
        title: "Web Security Guide",
        url: "internal://knowledge/security",
        snippet: "Essential security: HTTPS (SSL/TLS), firewall (UFW), strong passwords, 2FA, input validation, rate limiting, security headers (CSP, HSTS). Regular updates, backups, and monitoring are critical.",
        relevance: 0.8,
      },
      "nginx": {
        title: "Nginx Configuration Guide",
        url: "internal://knowledge/nginx",
        snippet: "Nginx is a high-performance web server and reverse proxy. Key directives: server (virtual host), location (URL routing), proxy_pass (reverse proxy), upstream (load balancing). Essential for Next.js production deployment.",
        relevance: 0.8,
      },
      "cloudflare": {
        title: "Cloudflare CDN Guide",
        url: "internal://knowledge/cloudflare",
        snippet: "Cloudflare provides CDN, DDoS protection, DNS, and SSL. Features: auto-minification, caching, page rules, workers (serverless), tunnel (expose local server). Free tier available.",
        relevance: 0.8,
      },
    };

    const matched = Object.entries(knowledge).filter(([key]) => lower.includes(key));
    if (matched.length > 0) {
      return matched.map(([, value]) => value);
    }

    return [{
      title: "FahadCloud Knowledge Base",
      url: "internal://knowledge/general",
      snippet: "I can help you with domains, hosting, DNS, SSL, deployment, security, monitoring, and more. Ask me anything about cloud services!",
      relevance: 0.5,
    }];
  }
}

