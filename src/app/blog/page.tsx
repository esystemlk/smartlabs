'use client';
import Link from 'next/link';
import { motion } from "framer-motion";
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { 
  BookOpen, 
  Calendar,
  Clock,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';

export default function Blog() {
  const { firestore } = useFirebase();
  const postsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'blog_posts'), orderBy('publishDate', 'desc')) : null),
    [firestore]
  );
  const { data: blogPosts, isLoading } = useCollection(postsQuery);

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <BookOpen className="h-4 w-4" />
              <span>Smart Labs Blog</span>
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Insights & <span className="gradient-text">Resources</span>
            </h1>
            
            <p className="text-xl text-muted-foreground">
              Expert tips, study strategies, and the latest news in English proficiency testing.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-20 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading && [...Array(3)].map((_, index) => (
                 <motion.div
                    key={index}
                    className="group glass-card rounded-2xl overflow-hidden"
                  >
                    <div className="h-48 bg-muted animate-pulse" />
                    <div className="p-6">
                      <div className="h-4 bg-muted w-1/3 rounded mb-4 animate-pulse"/>
                      <div className="h-6 bg-muted w-3/4 rounded mb-3 animate-pulse"/>
                      <div className="h-4 bg-muted w-full rounded mb-2 animate-pulse"/>
                      <div className="h-4 bg-muted w-full rounded mb-4 animate-pulse"/>
                      <div className="flex items-center justify-between animate-pulse">
                         <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-muted"/>
                           <div className="h-4 bg-muted w-24 rounded"/>
                         </div>
                         <div className="h-4 bg-muted w-16 rounded"/>
                      </div>
                    </div>
                 </motion.div>
            ))}
            {blogPosts?.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <Link href={`/blog/${post.slug}`} className="block h-full">
                  <div className={`h-48 bg-gradient-to-br from-primary to-purple-500 relative bg-cover bg-center`} style={{backgroundImage: `url(${post.image})`}}>
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col h-[calc(100%-12rem)]">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{post.publishDate?.toDate().toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>5 min read</span>
                      </div>
                    </div>
                    
                    <h2 className="font-display text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3 flex-grow">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                          {post.authorId?.split(' ').map((n: string) => n[0]).join('') || 'SL'}
                        </div>
                        <span className="text-sm text-muted-foreground">{post.authorId}</span>
                      </div>
                      
                      <div
                        className="flex items-center text-primary font-medium text-sm group-hover:gap-2 gap-1 transition-all"
                      >
                        Read <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>

          {!isLoading && blogPosts && blogPosts.length > 3 &&
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Button variant="heroOutline" size="lg">
                Load More Articles
              </Button>
            </motion.div>
          }
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-12 text-center max-w-2xl mx-auto"
          >
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-muted-foreground mb-8">
              Get the latest study tips, exam updates, and exclusive resources delivered to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 h-12 px-4 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button variant="hero" size="lg">
                Subscribe
              </Button>
            </form>
          </motion.div>
        </div>
      </section>
    </>
  );
}
