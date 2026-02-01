"use client";

import { useState, useEffect } from 'react';
import { Play, ExternalLink, X } from 'lucide-react';
import Link from 'next/link';

interface Video {
    id: string;
    title: string;
    thumbnail: string;
    views: string;
    date: string;
}

export function VideoGallery({ videos }: { videos: Video[] }) {
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (selectedVideo) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [selectedVideo]);

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {videos.map((video, idx) => (
                    <div
                        key={video.id || idx}
                        className="group relative bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-white/5 hover:border-red-600/50 transition-all duration-300 hover:-translate-y-2 block"
                    >
                        {/* Thumbnail - Click to Open Modal */}
                        <div
                            className="aspect-video relative overflow-hidden bg-zinc-800 cursor-pointer"
                            onClick={() => setSelectedVideo(video.id)}
                        >
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
                        </div>

                        <div className="p-6">
                            <h3 className="font-bold text-lg mb-3 line-clamp-2 leading-tight group-hover:text-red-500 transition-colors cursor-pointer" onClick={() => setSelectedVideo(video.id)}>
                                {video.title}
                            </h3>
                            <div className="flex items-center justify-between text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
                                <span>{video.views}</span>
                                <span>{video.date}</span>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedVideo(video.id)}
                                    className="flex-1 bg-white/10 hover:bg-red-600 hover:text-white text-zinc-300 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Play className="w-4 h-4" /> Play
                                </button>
                                <Link
                                    href={`https://www.youtube.com/watch?v=${video.id}`}
                                    target="_blank"
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-400 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    <ExternalLink className="w-4 h-4" /> YouTube
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Video Modal */}
            {selectedVideo && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                        <button
                            onClick={() => setSelectedVideo(null)}
                            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-red-600 rounded-full text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <div className="aspect-video w-full">
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                    {/* Backdrop click to close */}
                    <div className="absolute inset-0 -z-10" onClick={() => setSelectedVideo(null)}></div>
                </div>
            )}
        </>
    );
}
