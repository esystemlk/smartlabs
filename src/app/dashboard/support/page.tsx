
'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, addDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function SupportPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(
            collection(firestore, `support_chats/${user.uid}/messages`),
            orderBy('timestamp', 'asc')
          )
        : null,
    [firestore, user]
  );
  
  const { data: messages, isLoading: messagesLoading } = useCollection(messagesQuery);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !messageText.trim()) return;

    const trimmedMessage = messageText.trim();
    setMessageText('');

    const messagesRef = collection(firestore, `support_chats/${user.uid}/messages`);
    const threadRef = doc(firestore, `support_chats/${user.uid}`);
    
    await addDoc(messagesRef, {
      text: trimmedMessage,
      senderId: user.uid,
      senderRole: 'user',
      timestamp: serverTimestamp(),
    });
    
    await setDoc(threadRef, {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userEmail: user.email,
        lastMessage: trimmedMessage,
        lastMessageTimestamp: serverTimestamp(),
        isReadByAdmin: false,
    }, { merge: true });

    scrollToBottom();
  };

  if (isUserLoading) {
    return <div className="container mx-auto py-10"><p>Loading...</p></div>;
  }
  
  return (
    <div>
        <Button asChild variant="ghost" className="mb-4">
            <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
        </Button>
        <Card className="h-[75vh] flex flex-col">
        <CardHeader>
            <div className="flex items-center gap-4">
            <MessageSquare className="h-8 w-8 text-primary" />
            <div>
                <CardTitle>Support Chat</CardTitle>
                <CardDescription>Ask us anything. We're here to help!</CardDescription>
            </div>
            </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messagesLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-12 w-3/4 ml-auto" />
                <Skeleton className="h-12 w-3/4" />
            </div>
            ) : (
            messages?.map((msg) => {
                const isSender = msg.senderId === user?.uid;
                return (
                <div key={msg.id} className={cn('flex items-end gap-2', isSender ? 'justify-end' : 'justify-start')}>
                    {!isSender && (
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>S</AvatarFallback>
                        </Avatar>
                    )}
                    <div className={cn('max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2', isSender ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={cn("text-xs mt-1", isSender ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                        {msg.timestamp?.toDate().toLocaleTimeString()}
                    </p>
                    </div>
                    {isSender && user && (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                            <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                    )}
                </div>
                );
            })
            )}
            <div ref={messagesEndRef} />
        </CardContent>
        <CardFooter className="pt-6">
            <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
            <Input 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
            />
            <Button type="submit" size="icon" disabled={!messageText.trim()}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
            </Button>
            </form>
        </CardFooter>
        </Card>
    </div>
  );
}
