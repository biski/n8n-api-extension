import { getSubtitles, Subtitle } from 'youtube-caption-extractor';

export type TranscriptFormat = 'json' | 'text' | 'srt' | 'vtt';

export class YoutubeService {
    async getTranscript(videoId: string, format: TranscriptFormat = 'json', lang: string = 'en'): Promise<any> {
        try {
            console.log(`[YoutubeService] Fetching transcript for video: ${videoId}, lang: ${lang}`);
            
            // Try with specified language first
            let subtitles = await getSubtitles({ videoID: videoId, lang });
            console.log(`[YoutubeService] Retrieved ${subtitles?.length || 0} subtitle entries for lang: ${lang}`);
            
            // If no subtitles found with specified language, try without language parameter (auto-detect)
            if (!subtitles || subtitles.length === 0) {
                console.log(`[YoutubeService] No subtitles for ${lang}, trying auto-detect...`);
                subtitles = await getSubtitles({ videoID: videoId });
                console.log(`[YoutubeService] Auto-detect returned ${subtitles?.length || 0} subtitle entries`);
            }
            
            // If still no subtitles found, throw an error
            if (!subtitles || subtitles.length === 0) {
                throw new Error('No captions/subtitles available for this video. The video may not have captions enabled or may be restricted.');
            }
            
            switch (format) {
                case 'text':
                    return {
                        videoId,
                        success: true,
                        format: 'text',
                        content: this.formatAsText(subtitles)
                    };
                
                case 'srt':
                    return {
                        videoId,
                        success: true,
                        format: 'srt',
                        content: this.formatAsSRT(subtitles)
                    };
                
                case 'vtt':
                    return {
                        videoId,
                        success: true,
                        format: 'vtt',
                        content: this.formatAsVTT(subtitles)
                    };
                
                case 'json':
                default:
                    return {
                        videoId,
                        success: true,
                        format: 'json',
                        transcript: subtitles
                    };
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to fetch transcript: ${message}`);
        }
    }

    private formatAsText(subtitles: Subtitle[]): string {
        return subtitles.map(sub => sub.text).join(' ');
    }

    private formatAsSRT(subtitles: Subtitle[]): string {
        return subtitles.map((sub, index) => {
            const start = parseFloat(sub.start);
            const dur = parseFloat(sub.dur);
            const startTime = this.formatSRTTime(start);
            const endTime = this.formatSRTTime(start + dur);
            return `${index + 1}\n${startTime} --> ${endTime}\n${sub.text}\n`;
        }).join('\n');
    }

    private formatAsVTT(subtitles: Subtitle[]): string {
        const header = 'WEBVTT\n\n';
        const cues = subtitles.map((sub, index) => {
            const start = parseFloat(sub.start);
            const dur = parseFloat(sub.dur);
            const startTime = this.formatVTTTime(start);
            const endTime = this.formatVTTTime(start + dur);
            return `${index + 1}\n${startTime} --> ${endTime}\n${sub.text}`;
        }).join('\n\n');
        return header + cues;
    }

    private formatSRTTime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    }

    private formatVTTTime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
    }
}
