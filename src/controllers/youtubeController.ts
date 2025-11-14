import { Response } from 'express';
import { YoutubeService, TranscriptFormat } from '../services/youtubeService';
import { AuthenticatedRequest } from '../types';

class YoutubeController {
    private youtubeService: YoutubeService;

    constructor() {
        this.youtubeService = new YoutubeService();
    }

    async getTranscript(req: AuthenticatedRequest, res: Response) {
        try {
            const { videoId } = req.params;
            const format = (req.query.format as TranscriptFormat) || 'json';
            const lang = (req.query.lang as string) || 'en';

            if (!videoId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Video ID is required' 
                });
            }

            // Validate videoId format (YouTube IDs are 11 characters, alphanumeric, - and _)
            const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/;
            if (!videoIdRegex.test(videoId)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid YouTube video ID format'
                });
            }

            // Validate format
            const validFormats: TranscriptFormat[] = ['json', 'text', 'srt', 'vtt'];
            if (!validFormats.includes(format)) {
                return res.status(400).json({ 
                    success: false, 
                    error: `Invalid format. Must be one of: ${validFormats.join(', ')}` 
                });
            }

            const result = await this.youtubeService.getTranscript(videoId, format, lang);
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

export default YoutubeController;
