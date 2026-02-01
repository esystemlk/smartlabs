import Link from 'next/link';
import { getLatestVideos } from '@/app/actions/get-youtube-videos';
import { VideoGallery } from '@/components/video-gallery';

// Mock Data as Fallback
const mockVideos = [
    { title: 'Mastering PTE Speaking: Tips & Tricks', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', views: '1.2K views', date: '2 days ago', id: 'dQw4w9WgXcQ' },
    { title: 'IELTS Writing Task 2: Full Walkthrough', thumbnail: 'https://img.youtube.com/vi/M7lc1UVf-VE/maxresdefault.jpg', views: '3.4K views', date: '1 week ago', id: 'M7lc1UVf-VE' },
    { title: 'How to Improve Your Vocabulary Fast', thumbnail: 'https://img.youtube.com/vi/S-sjd1GkZfM/maxresdefault.jpg', views: '5K views', date: '2 weeks ago', id: 'S-sjd1GkZfM' },
    { title: 'English Grammar 101: Tenses Made Easy', thumbnail: 'https://img.youtube.com/vi/L9G9qB7uZSE/maxresdefault.jpg', views: '10K views', date: '1 month ago', id: 'L9G9qB7uZSE' },
    { title: 'Study With Me: 2 Hour Focus Session', thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/maxresdefault.jpg', views: '800 views', date: '1 month ago', id: 'jfKfPfyJRdk' },
    { title: 'Smart Labs Success Stories: John Doe', thumbnail: 'https://img.youtube.com/vi/5qap5aO4i9A/maxresdefault.jpg', views: '2.1K views', date: '2 months ago', id: '5qap5aO4i9A' },
];

export const revalidate = 3600; // Revalidate page every hour

export default async function VideosPage() {
    const realVideos = await getLatestVideos();
    const displayVideos = realVideos.length > 0 ? realVideos : mockVideos;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white">
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 p-4">
                <div className="container mx-auto flex items-center justify-between px-4">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <Link href="/" className="flex items-center gap-1">
                            <span className="text-red-600">Smart</span>Tube
                        </Link>
                    </div>
                    <nav className="flex gap-6 text-sm font-medium">
                        <Link href="/" className="hover:text-red-500 transition-colors">Home</Link>
                        <Link href="/dashboard" className="hover:text-red-500 transition-colors">Dashboard</Link>
                        <Link
                            href="https://www.youtube.com/@SmartLabs-Official"
                            target="_blank"
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-full text-white transition-colors"
                        >
                            Subscribe
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="container mx-auto pt-28 pb-12 px-4">
                <section className="mb-16 text-center">
                    <h1 className="text-4xl md:text-7xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600 tracking-tighter">
                        LATEST VIDEOS
                    </h1>
                    <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                        Watch our latest tutorials, success stories, and educational content directly from our YouTube channel.
                        {realVideos.length > 0 && <span className="text-green-500 font-bold ml-2">● Live Sync Active</span>}
                    </p>
                </section>

                <VideoGallery videos={displayVideos} />

                <div className="mt-16 text-center">
                    <Link href="https://www.youtube.com/@SmartLabs-Official" target="_blank" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-red-600 rounded-full hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30">
                        Visit Our Official YouTube Channel
                    </Link>
                </div>
            </main>
        </div>
    );
}
