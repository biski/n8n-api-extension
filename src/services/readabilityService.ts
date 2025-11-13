import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export class ReadabilityService {
    private readonly FETCH_TIMEOUT = 30000; // 30 seconds
    private readonly MAX_CONTENT_SIZE = 10 * 1024 * 1024; // 10MB

    async extractArticle(url: string): Promise<any> {
        try {
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.FETCH_TIMEOUT);

            try {
                // Fetch the webpage with timeout
                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; n8n-data-service/1.0)'
                    }
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
                }

                // Check content size
                const contentLength = response.headers.get('content-length');
                if (contentLength && parseInt(contentLength) > this.MAX_CONTENT_SIZE) {
                    throw new Error('Content size exceeds maximum allowed limit (10MB)');
                }

                const html = await response.text();

                // Check actual size after download
                if (html.length > this.MAX_CONTENT_SIZE) {
                    throw new Error('Content size exceeds maximum allowed limit (10MB)');
                }

                // Parse HTML with JSDOM
                const dom = new JSDOM(html, { url });

                // Extract article content with Readability
                const reader = new Readability(dom.window.document);
                const article = reader.parse();

                if (!article) {
                    throw new Error('Failed to extract article content');
                }

                return {
                    success: true,
                    url,
                    title: article.title,
                    content: article.textContent,
                    excerpt: article.excerpt,
                    byline: article.byline,
                    length: article.length,
                    siteName: article.siteName
                };
            } catch (error) {
                clearTimeout(timeoutId);
                if (error instanceof Error && error.name === 'AbortError') {
                    throw new Error('Request timeout - the server took too long to respond');
                }
                throw error;
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to extract article: ${message}`);
        }
    }
}
