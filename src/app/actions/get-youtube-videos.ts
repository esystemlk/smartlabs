'use server';

export interface YouTubeVideo {
    id: string;
    title: string;
    thumbnail: string;
    views: string;
    date: string;
    description: string;
}

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;

export async function getLatestVideos(): Promise<YouTubeVideo[]> {
    console.log("--- DEBUGGING YOUTUBE ---");
    console.log("API KEY (Exists?):", !!YOUTUBE_API_KEY);
    console.log("CHANNEL ID:", CHANNEL_ID);

    // Fallback to empty array if keys are missing, allowing UI to show mock data
    if (!YOUTUBE_API_KEY || !CHANNEL_ID) {
        console.log("YouTube API keys missing, using mock data mode.");
        return [];
    }

    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=9&type=video`,
            { next: { revalidate: 0 } } // No cache for debug
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("YouTube API Error Details:", JSON.stringify(errorData, null, 2));
            throw new Error(`YouTube API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.items) return [];

        return data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&amp;/g, '&'), // Basic HTML entity decode
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
            views: "Watch Now", // Search API doesn't provide statistics
            date: new Date(item.snippet.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            description: item.snippet.description
        }));

    } catch (error) {
        console.error("Failed to fetch YouTube videos:", error);
        return [];
    }
}
