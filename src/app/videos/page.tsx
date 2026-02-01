import { Play, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { getLatestVideos } from '@/app/actions/get-youtube-videos';

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
                        <span className="text-red-600">Smart</span>Tube
                    </div>
                    <nav className="flex gap-6 text-sm font-medium">
                        <Link href="/" className="hover:text-red-500 transition-colors">Home</Link>
                        <Link href="/dashboard" className="hover:text-red-500 transition-colors">Dashboard</Link>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayVideos.map((video, idx) => (
                        <Link
                            href={`https://www.youtube.com/watch?v=${video.id}`}
                            target="_blank"
                            key={video.id || idx}
                            className="group relative bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-white/5 hover:border-red-600/50 transition-all duration-300 hover:-translate-y-2 cursor-pointer block"
                        >
                            {/* Thumbnail */}
                            <div className="aspect-video relative overflow-hidden bg-zinc-800">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="bg-red-600 p-4 rounded-full shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300">
                                        <Play className="fill-white text-white h-8 w-8 ml-1" />
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ExternalLink className="w-3 h-3" /> YouTube
                                </div>
                            </div>

                            <div className="p-6">
                                <h3 className="font-bold text-lg mb-3 line-clamp-2 leading-tight group-hover:text-red-500 transition-colors">
                                    {video.title}
                                </h3>
                                <div className="flex items-center justify-between text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                    <span>{video.views}</span>
                                    <span>{video.date}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <Link href="https://youtube.com" target="_blank" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-red-600 rounded-full hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30">
                        Visit Our YouTube Channel
                    </Link>
                </div>
            </main>
        </div>
    );
}
