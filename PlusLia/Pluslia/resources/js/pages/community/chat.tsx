import { Head, useForm, usePage } from '@inertiajs/react';
import { MessageCircle, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { sendMessage as sendMessageAction } from '@/actions/App/Http/Controllers/CommunityHubController';
import AppLayout from '@/layouts/app-layout';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import { chat as chatRoute } from '@/routes/community';

interface Message {
    id: number;
    body: string;
    created_at: string;
    user: { id: number; name: string };
    is_mine: boolean;
}

interface Props {
    community: { id: number; name: string };
    messages: Message[];
}

function initials(name: string) {
    return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function avatarColor(name: string) {
    const hues = [30, 60, 120, 180, 200, 240, 280, 320];
    let h = 0;
    for (let i = 0; i < name.length; i++) { h = (h + name.charCodeAt(i)) % hues.length; }
    return `oklch(0.72 0.13 ${hues[h]})`;
}

function MessageBubble({ message }: { message: Message }) {
    const time = new Date(message.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    if (message.is_mine) {
        return (
            <div className="flex justify-end gap-2">
                <div className="flex max-w-xs flex-col items-end gap-1 lg:max-w-md">
                    <div className="mono-label" style={{ opacity: 0.55 }}>Tú · {time}</div>
                    <div
                        className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                        style={{ background: 'var(--ink)', color: 'var(--cream)', borderTopRightRadius: 4 }}
                    >
                        {message.body}
                    </div>
                </div>
            </div>
        );
    }

    const color = avatarColor(message.user.name);

    return (
        <div className="flex gap-2.5">
            <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-5 font-mono text-[11px]"
                style={{ background: color, color: 'var(--cream)' }}
            >
                {initials(message.user.name)}
            </div>
            <div className="flex max-w-xs flex-col gap-1 lg:max-w-md">
                <div className="mono-label" style={{ opacity: 0.55 }}>{message.user.name} · {time}</div>
                <div
                    className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                    style={{ background: 'var(--cream)', border: '1px solid var(--line)', borderTopLeftRadius: 4 }}
                >
                    {message.body}
                </div>
            </div>
        </div>
    );
}

export default function Chat({ community, messages: initialMessages }: Props) {
    const { auth } = usePage<{ auth: { user: { id: number } } }>().props;
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const bottomRef = useRef<HTMLDivElement>(null);
    const { data, setData, post, processing, reset } = useForm({ body: '' });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        // @ts-expect-error — Echo is globally available via Reverb
        if (typeof window.Echo === 'undefined') { return; }

        // @ts-expect-error — Echo global injected by Reverb
        const channel = window.Echo.private(`community.${community.id}`);
        channel.listen('.MessageSent', (e: { id: number; body: string; created_at: string; user: { id: number; name: string } }) => {
            setMessages((prev) => [
                ...prev,
                { ...e, is_mine: e.user.id === auth.user.id },
            ]);
        });

        return () => {
            // @ts-expect-error — Echo global injected by Reverb
            window.Echo.leave(`community.${community.id}`);
        };
    }, [community.id]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!data.body.trim()) { return; }
        post(sendMessageAction().url, {
            preserveScroll: true,
            onSuccess: () => reset('body'),
        });
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit(e as unknown as React.FormEvent);
        }
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard() }, { title: 'Chat', href: chatRoute() }]}>
            <Head title={`Chat · ${community.name}`} />
            <div className="flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>

                {/* header */}
                <div
                    className="flex items-center gap-4 px-6 py-4"
                    style={{ borderBottom: '1px solid var(--line)' }}
                >
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                    >
                        <MessageCircle size={18} />
                    </div>
                    <div className="flex-1">
                        <div className="serif text-xl"># general</div>
                        <div className="mono-label">{community.name} · canal de todos los vecinos</div>
                    </div>
                    <span className="pill pill-green">
                        <span
                            className="inline-block w-1.5 h-1.5 rounded-full"
                            style={{ background: 'var(--ink)', animation: 'pulse 2s infinite' }}
                        />
                        Reverb · WS
                    </span>
                </div>

                {/* messages */}
                <div
                    className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4"
                    style={{ background: 'var(--cream-2)' }}
                >
                    {messages.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center mono-label">
                            Sé el primero en escribir algo en el chat de la comunidad.
                        </div>
                    ) : (
                        messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* input */}
                <form onSubmit={submit} className="px-4 py-3" style={{ borderTop: '1px solid var(--line)', background: 'var(--cream)' }}>
                    <div
                        className="flex items-center gap-2 px-4 py-1"
                        style={{ border: '1px solid var(--line)', borderRadius: 9999, background: 'var(--cream-2)' }}
                    >
                        <Textarea
                            placeholder="Escribe a la comunidad… (Intro para enviar)"
                            value={data.body}
                            onChange={(e) => setData('body', e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 py-3 px-0 text-sm"
                            maxLength={1000}
                        />
                        <button
                            type="submit"
                            disabled={processing || !data.body.trim()}
                            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40"
                            style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

Chat.layout = () => null;
