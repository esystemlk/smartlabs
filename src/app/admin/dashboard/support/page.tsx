
'use client';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, User, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function AdminSupportPage() {
    const { firestore } = useFirebase();
    const { user: adminUser } = useUser();
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

    const threadsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'support_chats'), orderBy('lastMessageTimestamp', 'desc')) : null,
        [firestore]
    );
    const { data: threads } = useCollection(threadsQuery);

    const handleSelectThread = async (threadId: string) => {
        setSelectedThreadId(threadId);
        if (firestore) {
            const threadRef = doc(firestore, 'support_chats', threadId);
            await updateDoc(threadRef, { isReadByAdmin: true });
        }
    };
    
    return (
        <div className="w-full min-h-screen">
          <section className="py-8 md:py-12">
            <div className="container mx-auto">
              <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-headline font-bold">Support Center</h1>
                <p className="text-md text-muted-foreground mt-1">Manage all student support conversations.</p>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 h-[75vh]">
                <Card className="md:col-span-1 lg:col-span-1 flex flex-col">
                    <CardHeader>
                        <CardTitle>Conversations</CardTitle>
                        <CardDescription>{threads?.length || 0} active threads</CardDescription>
                    </CardHeader>
                    <ScrollArea className="flex-1">
                        <CardContent className="p-0">
                            {threads?.map((thread) => (
                                <div key={thread.id}>
                                    <button
                                        className={cn(
                                            "w-full text-left p-4 hover:bg-muted/50",
                                            selectedThreadId === thread.id && 'bg-muted'
                                        )}
                                        onClick={() => handleSelectThread(thread.id)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold truncate">{thread.userName}</p>
                                            {!thread.isReadByAdmin && <Badge variant="destructive" className="flex-shrink-0">New</Badge>}
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">{thread.lastMessage}</p>
                                    </button>
                                    <Separator />
                                </div>
                            ))}
                        </CardContent>
                    </ScrollArea>
                </Card>
                <div className="md:col-span-2 lg:col-span-3">
                    <ChatWindow threadId={selectedThreadId} adminUser={adminUser} />
                </div>
              </div>
            </div>
          </section>
        </div>
    );
}

function ChatWindow({ threadId, adminUser }: { threadId: string | null, adminUser: any }) {
    const { firestore } = useFirebase();
    const [messageText, setMessageText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const messagesQuery = useMemoFirebase(
        () => threadId ? query(collection(firestore, `support_chats/${threadId}/messages`), orderBy('timestamp', 'asc')) : null,
        [firestore, threadId]
    );

    const { data: messages, isLoading } = useCollection(messagesQuery);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    useEffect(scrollToBottom, [messages]);
    
    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!firestore || !adminUser || !threadId || !messageText.trim()) return;

        const trimmedMessage = messageText.trim();
        setMessageText('');

        const messagesRef = collection(firestore, `support_chats/${threadId}/messages`);
        const threadRef = doc(firestore, 'support_chats', threadId);

        await addDoc(messagesRef, {
            text: trimmedMessage,
            senderId: adminUser.uid,
            senderRole: 'admin',
            timestamp: serverTimestamp(),
        });

        await updateDoc(threadRef, {
            lastMessage: trimmedMessage,
            lastMessageTimestamp: serverTimestamp(),
            isReadByAdmin: true,
        });

        scrollToBottom();
    };

    if (!threadId) {
        return (
            <Card className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                    <p>Select a conversation to start chatting.</p>
                </div>
            </Card>
        );
    }
    
    return (
        <Card className="h-full flex flex-col">
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                 {isLoading ? <p>Loading messages...</p> : messages?.map((msg) => {
                    const isSender = msg.senderId === adminUser?.uid;
                    return (
                        <div key={msg.id} className={cn('flex items-end gap-2', isSender ? 'justify-end' : 'justify-start')}>
                             {!isSender && (
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                            )}
                            <div className={cn('max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2', isSender ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                <p className="text-sm">{msg.text}</p>
                                 <p className={cn("text-xs mt-1", isSender ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                                    {msg.timestamp?.toDate().toLocaleTimeString()}
                                </p>
                            </div>
                             {isSender && (
                                <Avatar className="h-8 w-8">
                                     <AvatarFallback>S</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </CardContent>
            <CardFooter className="pt-6">
                <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                    <Input 
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your reply..."
                    />
                    <Button type="submit" size="icon" disabled={!messageText.trim()}>
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
