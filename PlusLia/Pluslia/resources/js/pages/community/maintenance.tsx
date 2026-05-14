import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Clock, Plus, Trash2, Wrench } from 'lucide-react';
import { useState } from 'react';
import { store as storeTask, update as updateTask, destroy as destroyTask } from '@/actions/App/Http/Controllers/MaintenanceTaskController';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import { index as maintenanceIndex } from '@/routes/community/maintenance';

interface Member { id: number; name: string }

interface Task {
    id: number;
    title: string;
    description: string | null;
    type: 'preventive' | 'corrective';
    status: 'pending' | 'in_progress' | 'done';
    scheduled_at: string | null;
    completed_at: string | null;
    created_at: string;
    creator: string;
    assignee: string | null;
}

interface Props {
    community: { id: number; name: string };
    tasks: Task[];
    members: Member[];
    isAdmin: boolean;
}

const STATUS_LABELS = { pending: 'Pendiente', in_progress: 'En progreso', done: 'Hecho' };
const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
    pending: 'secondary', in_progress: 'default', done: 'outline',
};
const TYPE_LABELS = { preventive: 'Preventivo', corrective: 'Correctivo' };

const STATUS_COLORS = {
    pending: { bg: 'var(--cream-2)', icon: 'oklch(0.55 0.02 60)' },
    in_progress: { bg: 'var(--amber)', icon: 'var(--ink)' },
    done: { bg: 'var(--green-pluslia)', icon: 'var(--green-deep)' },
};

function TaskCard({ task, isAdmin, members }: { task: Task; isAdmin: boolean; members: Member[] }) {
    function deleteTask() {
        if (!confirm(`¿Eliminar "${task.title}"?`)) { return; }
        router.delete(destroyTask(task.id).url, { preserveScroll: true });
    }

    function updateStatus(status: string) {
        router.patch(updateTask(task.id).url, { status, assigned_to: task.assignee ? members.find(m => m.name === task.assignee)?.id : null }, { preserveScroll: true });
    }

    const StatusIcon = task.status === 'done' ? CheckCircle2 : task.status === 'in_progress' ? AlertCircle : Clock;
    const colors = STATUS_COLORS[task.status];

    return (
        <div
            className="rounded-xl border p-4 flex items-start gap-4"
            style={{ borderColor: 'var(--line)' }}
        >
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: colors.bg }}
            >
                <StatusIcon size={18} style={{ color: colors.icon }} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-sm">{task.title}</p>
                    <span className="pill" style={{ background: colors.bg, color: 'var(--ink)' }}>
                        {STATUS_LABELS[task.status]}
                    </span>
                    <span className="pill pill-cream">{TYPE_LABELS[task.type]}</span>
                </div>
                {task.description && <p className="text-xs mt-1 opacity-60">{task.description}</p>}
                <div className="mono-label mt-1">
                    {task.creator}
                    {task.assignee && ` · asignado a ${task.assignee}`}
                    {task.scheduled_at && ` · ${new Date(task.scheduled_at).toLocaleDateString('es-ES')}`}
                    {task.completed_at && ` · completado ${new Date(task.completed_at).toLocaleDateString('es-ES')}`}
                </div>
            </div>
            {isAdmin && task.status !== 'done' && (
                <div className="flex shrink-0 gap-1.5">
                    {task.status === 'pending' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus('in_progress')}>Iniciar</Button>
                    )}
                    {task.status === 'in_progress' && (
                        <Button size="sm" onClick={() => updateStatus('done')} style={{ background: 'var(--ink)', color: 'var(--cream)' }} className="hover:opacity-90">
                            <CheckCircle2 size={13} className="mr-1.5" />Completar
                        </Button>
                    )}
                    <button
                        className="p-2 rounded-lg hover:bg-red-50 text-destructive transition-colors"
                        onClick={deleteTask}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}

function NewTaskForm({ members, onCancel }: { members: Member[]; onCancel: () => void }) {
    const form = useForm({
        title: '',
        description: '',
        type: 'preventive' as 'preventive' | 'corrective',
        scheduled_at: '',
        assigned_to: 'none',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.transform((d) => ({
            ...d,
            assigned_to: d.assigned_to === 'none' ? null : d.assigned_to,
        })).post(storeTask().url, {
            preserveScroll: true,
            onSuccess: () => { form.reset(); onCancel(); },
        });
    }

    return (
        <div className="rounded-xl border border-dashed p-5" style={{ borderColor: 'var(--amber)' }}>
            <div className="font-semibold text-sm mb-4">Nueva tarea de mantenimiento</div>
            <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <Label>Título</Label>
                    <Input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} placeholder="Ej: Revisión anual inversores" />
                    <InputError message={form.errors.title} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>Descripción <span className="font-normal opacity-55">(opcional)</span></Label>
                    <Textarea value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} rows={2} />
                    <InputError message={form.errors.description} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label>Tipo</Label>
                        <Select value={form.data.type} onValueChange={(v) => form.setData('type', v as 'preventive' | 'corrective')}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="preventive">Preventivo</SelectItem>
                                <SelectItem value="corrective">Correctivo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Fecha programada <span className="font-normal opacity-55">(opcional)</span></Label>
                        <Input type="date" value={form.data.scheduled_at} onChange={(e) => form.setData('scheduled_at', e.target.value)} />
                        <InputError message={form.errors.scheduled_at} />
                    </div>
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>Asignar a <span className="font-normal opacity-55">(opcional)</span></Label>
                    <Select value={form.data.assigned_to} onValueChange={(v) => form.setData('assigned_to', v)}>
                        <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Sin asignar</SelectItem>
                            {members.map((m) => (
                                <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={form.errors.assigned_to} />
                </div>
                <div className="flex gap-2">
                    <Button type="submit" disabled={form.processing} style={{ background: 'var(--ink)', color: 'var(--cream)' }} className="hover:opacity-90">Crear tarea</Button>
                    <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                </div>
            </form>
        </div>
    );
}

export default function Maintenance({ community, tasks, members, isAdmin }: Props) {
    const [showForm, setShowForm] = useState(false);
    const flash = (usePage<{ flash?: { success?: string } }>().props as any).flash;

    const pending = tasks.filter((t) => t.status !== 'done');
    const done = tasks.filter((t) => t.status === 'done');

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard() }, { title: 'Mantenimiento', href: maintenanceIndex() }]}>
            <Head title={`Mantenimiento · ${community.name}`} />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="serif text-4xl leading-tight">Mantenimiento</h1>
                        <p className="mono-label mt-1">{community.name} · {tasks.length} tarea{tasks.length !== 1 ? 's' : ''}</p>
                    </div>
                    {isAdmin && !showForm && (
                        <Button size="sm" onClick={() => setShowForm(true)} style={{ background: 'var(--ink)', color: 'var(--cream)' }} className="hover:opacity-90">
                            <Plus size={13} className="mr-2" />Nueva tarea
                        </Button>
                    )}
                </div>

                {flash?.success && (
                    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--green-pluslia)', color: 'var(--ink)', border: '1px solid var(--green-deep)' }}>
                        {flash.success}
                    </div>
                )}

                {showForm && <NewTaskForm members={members} onCancel={() => setShowForm(false)} />}

                {tasks.length === 0 && !showForm ? (
                    <div className="rounded-xl border border-dashed p-10 flex flex-col items-center gap-2" style={{ borderColor: 'var(--line)' }}>
                        <Wrench size={36} style={{ opacity: 0.3 }} />
                        <p className="font-medium">Sin tareas de mantenimiento</p>
                        <p className="mono-label">
                            {isAdmin ? 'Crea tareas preventivas o correctivas para la instalación.' : 'El administrador publicará tareas de mantenimiento aquí.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {pending.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <div className="mono-label">Pendientes · {pending.length}</div>
                                {pending.map((t) => <TaskCard key={t.id} task={t} isAdmin={isAdmin} members={members} />)}
                            </div>
                        )}
                        {done.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <div className="mono-label">Completadas · {done.length}</div>
                                {done.map((t) => <TaskCard key={t.id} task={t} isAdmin={isAdmin} members={members} />)}
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}

Maintenance.layout = () => null;
