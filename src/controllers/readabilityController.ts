import { Response } from 'express';
import { ReadabilityService } from '../services/readabilityService';
import { AuthenticatedRequest } from '../types';

class ReadabilityController {
    private readabilityService: ReadabilityService;

    constructor() {
        this.readabilityService = new ReadabilityService();
    }

    async extractArticle(req: AuthenticatedRequest, res: Response) {
        try {
            const { url } = req.body;

            if (!url) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'URL is required in request body' 
                });
            }

            // Validate URL format
            let parsedUrl: URL;
            try {
                parsedUrl = new URL(url);
            } catch {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid URL format' 
                });
            }

            // Security: Only allow http and https protocols
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                return res.status(400).json({
                    success: false,
                    error: 'Only HTTP and HTTPS protocols are allowed'
                });
            }

            // Security: Prevent SSRF attacks - block private IPs and localhost
            const hostname = parsedUrl.hostname.toLowerCase();
            const blockedHostnames = [
                'localhost',
                '127.0.0.1',
                '0.0.0.0',
                '::1',
                'metadata.google.internal' // GCP metadata service
            ];
            
            if (blockedHostnames.includes(hostname) || 
                hostname.startsWith('10.') || 
                hostname.startsWith('172.16.') || 
                hostname.startsWith('192.168.') ||
                hostname.startsWith('169.254.')) {
                return res.status(400).json({
                    success: false,
                    error: 'Access to private IP addresses is not allowed'
                });
            }

            // Validate URL length (max 2048 characters)
            if (url.length > 2048) {
                return res.status(400).json({
                    success: false,
                    error: 'URL is too long (max 2048 characters)'
                });
            }

            const result = await this.readabilityService.extractArticle(url);
            res.status(200).json(result);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ 
                success: false, 
                error: message 
            });
        }
    }
}

export default ReadabilityController;
