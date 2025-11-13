import { Express } from 'express';
import YoutubeController from '../controllers/youtubeController';
import ReadabilityController from '../controllers/readabilityController';

const youtubeController = new YoutubeController();
const readabilityController = new ReadabilityController();

export function setRoutes(app: Express) {
    // YouTube transcript endpoint
    app.get('/youtube/transcript/:videoId', youtubeController.getTranscript.bind(youtubeController));
    
    // Article extraction endpoint
    app.post('/article/extract', readabilityController.extractArticle.bind(readabilityController));
}