'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { getLatestVideos, type YouTubeVideo } from '@/app/actions/get-youtube-videos';

/** Homepage "Free video lessons" strip: the 3 latest YouTube videos and a link to /videos. Hidden if there are none. */
export function HomeVideos() {
  const [videos, setVideos] = useState<YouTubeVideo[] | null>(null);

  useEffect(() => {
    let live = true;
    getLatestVideos().then(v => live && setVideos(v.slice(0, 3))).catch(() => live && setVideos([]));
    return () => { live = false; };
  }, []);

  if (videos && videos.length === 0) return null;

  return (
    <section className="py-20 sm:py-24 bg-white dark:bg-slate-950" aria-labelledby="home-videos-h">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-primary">Free video lessons</p>
            <h2 id="home-videos-h" className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-foreground">Learn with our latest videos</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">PTE and IELTS strategies, exam tips and student success stories from our YouTube channel.</p>
          </div>
          <Link href="/videos" className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
            All videos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(videos ?? [null, null, null]).map((v, i) => v ? (
            <a key={v.id} href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer"
              className="group rounded-2xl overflow-hidden border border-border bg-card hover:shadow-xl transition-shadow">
              <div className="relative aspect-video bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.thumbnail} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 grid place-items-center bg-black/0 group-hover:bg-black/30 transition-colors">
                  <PlayCircle className="h-14 w-14 text-white opacity-90 drop-shadow-lg" aria-hidden="true" />
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground leading-snug line-clamp-2">{v.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{v.date}</p>
              </div>
            </a>
          ) : (
            <div key={i} className="rounded-2xl overflow-hidden border border-border" aria-hidden="true">
              <div className="aspect-video bg-muted animate-pulse" />
              <div className="p-4 space-y-2"><div className="h-4 rounded bg-muted animate-pulse" /><div className="h-3 w-24 rounded bg-muted animate-pulse" /></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
