import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import { index as communitiesIndex, store as communityStore, create as communityCreate } from '@/routes/admin/communities';

export default function AdminCommunityCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        centroid_lat: '',
        centroid_lon: '',
        max_distance_m: '5000',
        sharing_policy: 'proportional',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(communityStore().url);
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard() }, { title: 'Admin · Comunidades', href: communitiesIndex() }, { title: 'Nueva', href: communityCreate() }]}>
            <Head title="Nueva comunidad" />
            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="serif text-4xl leading-tight">Nueva comunidad energética</h1>
                    <p className="mono-label mt-1">Crea una comunidad y luego añade miembros desde la edición.</p>
                </div>

                <div className="rounded-xl border p-6 max-w-xl" style={{ borderColor: 'var(--line)' }}>
                        <form onSubmit={submit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Comunidad Solar del Barrio"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="centroid_lat">Latitud del centroide</Label>
                                    <Input
                                        id="centroid_lat"
                                        type="number"
                                        step="any"
                                        value={data.centroid_lat}
                                        onChange={(e) => setData('centroid_lat', e.target.value)}
                                        placeholder="43.3336"
                                    />
                                    <InputError message={errors.centroid_lat} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="centroid_lon">Longitud del centroide</Label>
                                    <Input
                                        id="centroid_lon"
                                        type="number"
                                        step="any"
                                        value={data.centroid_lon}
                                        onChange={(e) => setData('centroid_lon', e.target.value)}
                                        placeholder="-3.0414"
                                    />
                                    <InputError message={errors.centroid_lon} />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="max_distance_m">Radio máximo (metros)</Label>
                                <Input
                                    id="max_distance_m"
                                    type="number"
                                    value={data.max_distance_m}
                                    onChange={(e) => setData('max_distance_m', e.target.value)}
                                    placeholder="5000"
                                />
                                <p className="text-muted-foreground text-xs">Distancia máxima desde el centroide para admitir miembros.</p>
                                <InputError message={errors.max_distance_m} />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label>Política de reparto</Label>
                                <Select value={data.sharing_policy} onValueChange={(v) => setData('sharing_policy', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="proportional">Proporcional (según coeficiente)</SelectItem>
                                        <SelectItem value="equal">Igual (partes iguales)</SelectItem>
                                        <SelectItem value="priority">Prioridad (según orden)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.sharing_policy} />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="submit" disabled={processing} style={{ background: 'var(--ink)', color: 'var(--cream)' }} className="hover:opacity-90">
                                    {processing ? 'Creando...' : 'Crear comunidad'}
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href={communitiesIndex()}>Cancelar</Link>
                                </Button>
                            </div>
                        </form>
                </div>
            </div>
        </AppLayout>
    );
}

AdminCommunityCreate.layout = () => null;
