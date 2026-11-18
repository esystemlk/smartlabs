import type { Metadata } from 'next';
import Link from 'next/link';
import { getLatestVideos } from '@/app/actions/get-youtube-videos';
import { VideoGallery } from '@/components/video-gallery';

const CHANNEL_URL = 'https://www.youtube.com/@SmartLabs-Official';

export const revalidate = 3600; // Revalidate page every hour

export const metadata: Metadata = {
    title: 'PTE & IELTS Video Lessons',
    description: 'Free PTE and IELTS video lessons from Smart Labs: speaking, writing, reading and listening strategies, exam tips and student success stories.',
    alternates: { canonical: '/videos' },
};

export default async function VideosPage() {
    // No made-up fallback videos: if the YouTube feed is unavailable, point to the channel instead.
    const displayVideos = await getLatestVideos();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white">
            <main className="container mx-auto pt-28 pb-16 px-4">
                <section className="mb-16 text-center">
                    <h1 className="text-4xl md:text-7xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600 tracking-tighter">
                        LATEST VIDEOS
                    </h1>
                    <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                        Watch our latest tutorials, success stories, and educational content directly from our YouTube channel.
                    </p>
                </section>

                {displayVideos.length > 0
                    ? <VideoGallery videos={displayVideos} />
                    : <p className="text-center text-zinc-400 text-lg">Our latest videos are on YouTube — open the channel below to watch them.</p>}

                <div className="mt-16 text-center">
                    <Link href={CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-red-600 rounded-full hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30">
                        Subscribe on YouTube
                    </Link>
                </div>
            </main>
        </div>
    );
}
