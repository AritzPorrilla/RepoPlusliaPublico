import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, ChevronDown, ChevronUp, Clock, Lock, Plus, Vote } from 'lucide-react';
import { useState } from 'react';
import { store as storePoll, vote as voteAction, close as closePoll } from '@/actions/App/Http/Controllers/CommunityPollController';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import { index as pollsIndex } from '@/routes/community/polls';

interface PollOption {
    id: number;
    text: string;
    votes: number;
    percentage: number;
}

interface Poll {
    id: number;
    title: string;
    description: string | null;
    type: 'yes_no' | 'multiple';
    status: 'open' | 'closed';
    is_open: boolean;
    closes_at: string | null;
    created_at: string;
    author: string;
    total_votes: number;
    has_voted: boolean;
    user_vote_option_id: number | null;
    options: PollOption[];
}

interface Props {
    community: { id: number; name: string };
    polls: Poll[];
    isAdmin: boolean;
}

function PollCard({ poll, isAdmin }: { poll: Poll; isAdmin: boolean }) {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [expanded, setExpanded] = useState(poll.is_open);

    function castVote() {
        if (!selectedOption) { return; }
        router.post(voteAction(poll.id).url, { option_id: selectedOption }, { preserveScroll: true });
    }

    function closeVote() {
        if (!confirm('¿Cerrar esta votación? No se podrán emitir más votos.')) { return; }
        router.post(closePoll(poll.id).url, {}, { preserveScroll: true });
    }

    const closesAt = poll.closes_at ? new Date(poll.closes_at).toLocaleDateString('es-ES') : null;

    return (
        <div
            className="rounded-xl border flex flex-col"
            style={{ borderColor: 'var(--line)', opacity: poll.is_open ? 1 : 0.7 }}
        >
            {/* header */}
            <div className="flex items-start justify-between gap-2 p-5">
                <div className="flex items-start gap-3">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: poll.is_open ? 'var(--cream-2)' : 'var(--cream-2)' }}
                    >
                        <Vote size={16} style={{ color: 'var(--amber-deep)' }} />
                    </div>
                    <div>
                        <div className="font-semibold text-sm">{poll.title}</div>
                        <div className="mono-label mt-0.5">
                            {poll.author} · {new Date(poll.created_at).toLocaleDateString('es-ES')}
                            {closesAt && ` · cierra ${closesAt}`}
                            {' · '}{poll.total_votes} voto{poll.total_votes !== 1 ? 's' : ''}
                        </div>
                        {poll.description && <p className="text-sm mt-1 opacity-70">{poll.description}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span
                        className="pill"
                        style={poll.is_open
                            ? { background: 'var(--green-pluslia)', color: 'var(--ink)' }
                            : { background: 'var(--cream-2)', color: 'var(--ink)', opacity: 0.6 }
                        }
                    >
                        {poll.is_open ? 'Abierta' : 'Cerrada'}
                    </span>
                    <button
                        className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            </div>

            {expanded && (
                <div
                    className="flex flex-col gap-3 px-5 pb-5"
                    style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}
                >
                    <div className="flex flex-col gap-2">
                        {poll.options.map((opt) => {
                            const isVoted = poll.user_vote_option_id === opt.id;
                            const showResults = poll.has_voted || !poll.is_open;
                            const isSelected = selectedOption === opt.id;

                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    disabled={poll.has_voted || !poll.is_open}
                                    onClick={() => setSelectedOption(isSelected ? null : opt.id)}
                                    className="relative flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-colors"
                                    style={{
                                        borderColor: isVoted ? 'var(--green-deep)' : isSelected ? 'var(--ink)' : 'var(--line)',
                                        background: isVoted ? 'var(--green-pluslia)' : isSelected ? 'var(--cream-2)' : 'transparent',
                                        cursor: (poll.has_voted || !poll.is_open) ? 'default' : 'pointer',
                                    }}
                                >
                                    {showResults && (
                                        <div
                                            className="absolute inset-y-0 left-0 rounded-xl transition-all"
                                            style={{ width: `${opt.percentage}%`, background: 'var(--amber)', opacity: 0.12 }}
                                        />
                                    )}
                                    <span className="relative flex flex-1 justify-between items-center">
                                        <span className="font-medium">{opt.text}</span>
                                        {showResults && (
                                            <span className="mono-label">{opt.votes} ({opt.percentage}%)</span>
                                        )}
                                    </span>
                                    {isVoted && <CheckCircle2 size={16} className="relative shrink-0" style={{ color: 'var(--green-deep)' }} />}
                                    {!poll.has_voted && poll.is_open && isSelected && (
                                        <div
                                            className="relative w-4 h-4 rounded-full shrink-0"
                                            style={{ background: 'var(--ink)', border: '2px solid var(--ink)' }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex gap-2 mt-1">
                        {!poll.has_voted && poll.is_open && (
                            <Button
                                size="sm"
                                disabled={!selectedOption}
                                onClick={castVote}
                                style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                                className="hover:opacity-90"
                            >
                                <Vote size={13} className="mr-2" />Votar
                            </Button>
                        )}
                        {poll.has_voted && (
                            <p className="flex items-center gap-1.5 mono-label">
                                <CheckCircle2 size={13} style={{ color: 'var(--green-deep)' }} />
                                Tu voto ha sido registrado
                            </p>
                        )}
                        {isAdmin && poll.is_open && (
                            <Button size="sm" variant="outline" onClick={closeVote}>
                                <Lock size={13} className="mr-2" />Cerrar votación
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function NewPollForm({ onCancel }: { onCancel: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        type: 'yes_no' as 'yes_no' | 'multiple',
        closes_at: '',
        options: ['', ''],
    });

    function addOption() {
        if (data.options.length < 8) {
            setData('options', [...data.options, '']);
        }
    }

    function removeOption(i: number) {
        setData('options', data.options.filter((_, idx) => idx !== i));
    }

    function updateOption(i: number, value: string) {
        const opts = [...data.options];
        opts[i] = value;
        setData('options', opts);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(storePoll().url, {
            preserveScroll: true,
            onSuccess: () => {
 reset(); onCancel(); 
},
        });
    }

    return (
        <div className="rounded-xl border p-5 border-dashed" style={{ borderColor: 'var(--amber)' }}>
            <div className="font-semibold text-sm mb-4">Nueva votación</div>
            <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <Label>Pregunta</Label>
                    <Input value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="¿Debemos instalar baterías comunitarias?" />
                    <InputError message={errors.title} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>Descripción <span className="font-normal opacity-55">(opcional)</span></Label>
                    <Textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={2} />
                    <InputError message={errors.description} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label>Tipo</Label>
                        <Select value={data.type} onValueChange={(v) => setData('type', v as 'yes_no' | 'multiple')}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="yes_no">Sí / No</SelectItem>
                                <SelectItem value="multiple">Opción múltiple</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Fecha de cierre <span className="font-normal opacity-55">(opcional)</span></Label>
                        <Input type="datetime-local" value={data.closes_at} onChange={(e) => setData('closes_at', e.target.value)} />
                        <InputError message={errors.closes_at} />
                    </div>
                </div>
                {data.type === 'multiple' && (
                    <div className="flex flex-col gap-2">
                        <Label>Opciones</Label>
                        {data.options.map((opt, i) => (
                            <div key={i} className="flex gap-2">
                                <Input value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Opción ${i + 1}`} />
                                {data.options.length > 2 && (
                                    <Button type="button" size="icon" variant="ghost" onClick={() => removeOption(i)}>×</Button>
                                )}
                            </div>
                        ))}
                        {data.options.length < 8 && (
                            <Button type="button" size="sm" variant="outline" onClick={addOption}>
                                <Plus size={13} className="mr-2" />Añadir opción
                            </Button>
                        )}
                        <InputError message={errors['options.0'] ?? errors.options as unknown as string} />
                    </div>
                )}
                <div className="flex gap-2">
                    <Button type="submit" disabled={processing} style={{ background: 'var(--ink)', color: 'var(--cream)' }} className="hover:opacity-90">
                        Crear votación
                    </Button>
                    <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                </div>
            </form>
        </div>
    );
}

export default function Polls({ community, polls, isAdmin }: Props) {
    const [showForm, setShowForm] = useState(false);
    const flash = (usePage<{ flash?: { success?: string } }>().props as any).flash;

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard() }, { title: 'Votaciones', href: pollsIndex() }]}>
            <Head title={`Votaciones · ${community.name}`} />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="serif text-4xl leading-tight">Votaciones</h1>
                        <p className="mono-label mt-1">{community.name} · {polls.length} encuesta{polls.length !== 1 ? 's' : ''}</p>
                    </div>
                    {isAdmin && !showForm && (
                        <Button size="sm" onClick={() => setShowForm(true)} style={{ background: 'var(--ink)', color: 'var(--cream)' }} className="hover:opacity-90">
                            <Plus size={13} className="mr-2" />Nueva votación
                        </Button>
                    )}
                </div>

                {flash?.success && (
                    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--green-pluslia)', color: 'var(--ink)', border: '1px solid var(--green-deep)' }}>
                        {flash.success}
                    </div>
                )}

                {showForm && <NewPollForm onCancel={() => setShowForm(false)} />}

                {polls.length === 0 && !showForm ? (
                    <div className="rounded-xl border border-dashed p-10 flex flex-col items-center gap-2" style={{ borderColor: 'var(--line)' }}>
                        <Clock size={36} style={{ opacity: 0.3 }} />
                        <p className="font-medium">Sin votaciones aún</p>
                        <p className="mono-label">
                            {isAdmin ? 'Crea la primera votación para consultar a los socios.' : 'El administrador creará votaciones cuando sea necesario.'}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {polls.map((poll) => <PollCard key={poll.id} poll={poll} isAdmin={isAdmin} />)}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

Polls.layout = () => null;
