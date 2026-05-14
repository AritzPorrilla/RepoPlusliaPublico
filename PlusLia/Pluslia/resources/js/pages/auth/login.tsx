import { Form, Head, Link } from '@inertiajs/react';
import { Check } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({ status, canResetPassword, canRegister }: Props) {
    return (
        <div className="flex h-dvh" style={{ background: 'var(--cream)' }}>
            <Head title="Entrar" />

            {/* Left panel */}
            <div className="flex w-full flex-col px-10 py-8 lg:w-[46%]">
                <div className="flex items-center gap-2">
                    <AppLogoIcon className="h-7 w-7 fill-current" />
                    <span className="text-base font-semibold">Pluslia</span>
                </div>

                <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
                    <div className="mb-2 flex items-center gap-3">
                        <span className="mono-label shrink-0" style={{ color: 'var(--amber-deep)' }}>BIENVENIDO DE NUEVO</span>
                        <hr className="flex-1" style={{ borderColor: 'var(--line)' }} />
                    </div>
                    <h1 className="serif mb-3 text-4xl leading-tight">
                        Entra en<br />
                        <span className="ital" style={{ color: 'var(--amber-deep)' }}>tu comunidad.</span>
                    </h1>
                    <p className="mb-8 text-sm" style={{ opacity: 0.5 }}>
                        El portal donde tus paneles, tu vecindario y tus cuotas viven juntos.
                    </p>

                    <Form {...store.form()} resetOnSuccess={['password']} className="flex flex-col gap-4">
                        {({ processing, errors }) => (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="email" className="mono-label">CORREO ELECTRÓNICO</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder="elena.marin@aurora.cat"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="password" className="mono-label">CONTRASEÑA</Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Contraseña"
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Checkbox id="remember" name="remember" tabIndex={3} />
                                        <Label htmlFor="remember" className="text-sm">Mantener sesión iniciada</Label>
                                    </div>
                                    {canResetPassword && (
                                        <TextLink href={request()} className="text-sm" tabIndex={5}>
                                            ¿Olvidaste la contraseña?
                                        </TextLink>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    tabIndex={4}
                                    disabled={processing}
                                    className="mt-2 w-full"
                                    style={{ background: 'var(--ink)', color: 'var(--cream)', borderRadius: 12 }}
                                    data-test="login-button"
                                >
                                    {processing && <Spinner />}
                                    → Entrar
                                </Button>

                                {canRegister && (
                                    <Button asChild variant="outline" className="w-full" style={{ borderRadius: 12 }}>
                                        <Link href={register()} tabIndex={6}>Crear cuenta nueva</Link>
                                    </Button>
                                )}

                                {status && (
                                    <div className="text-center text-sm font-medium" style={{ color: 'var(--green-deep)' }}>
                                        {status}
                                    </div>
                                )}
                            </>
                        )}
                    </Form>

                    <div
                        className="mt-6 flex items-start gap-3 rounded-xl px-4 py-3 text-xs"
                        style={{ background: 'oklch(0.92 0.08 145)', border: '1px solid oklch(0.82 0.1 145)' }}
                    >
                        <div
                            className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                            style={{ background: 'oklch(0.55 0.15 145)' }}
                        >
                            <Check size={10} style={{ color: 'white' }} strokeWidth={3} />
                        </div>
                        <p>
                            Tu cuenta protege datos sensibles de tu suministro.{' '}
                            <span style={{ color: 'oklch(0.38 0.14 145)', fontWeight: 500 }}>
                                Activa la verificación en dos pasos
                            </span>{' '}
                            tras entrar.
                        </p>
                    </div>
                </div>

                <div className="mono-label" style={{ opacity: 0.3 }}>
                    Pluslia v2.4 · Laravel Fortify · Sanctum
                </div>
            </div>

            {/* Right panel */}
            <div
                className="relative hidden flex-1 flex-col justify-end overflow-hidden p-12 lg:flex"
                style={{ background: 'oklch(0.10 0.03 60)' }}
            >
                {/* Amber glow blob */}
                <div
                    style={{
                        position: 'absolute',
                        top: '6%',
                        right: '4%',
                        width: 440,
                        height: 440,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, oklch(0.62 0.18 65) 0%, transparent 70%)',
                        opacity: 0.28,
                        pointerEvents: 'none',
                    }}
                />

                <div style={{ position: 'relative', color: 'var(--cream)' }}>
                    <div
                        className="mb-8 inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-xs"
                        style={{ background: 'oklch(0.22 0.06 65)', border: '1px solid oklch(0.32 0.1 65)', color: 'var(--amber)' }}
                    >
                        ◆ 226 COMUNIDADES ACTIVAS
                    </div>

                    <h2 className="serif mb-4 text-5xl leading-tight">
                        Hoy tu barrio<br />
                        generó <span className="ital" style={{ color: 'var(--amber)' }}>3,2 MWh.</span>
                    </h2>

                    <p className="mb-12 text-sm" style={{ opacity: 0.4 }}>
                        El equivalente al consumo de 360 hogares durante un día.
                    </p>

                    <div
                        className="grid grid-cols-3 gap-8 pt-8"
                        style={{ borderTop: '1px solid oklch(0.22 0.02 60)' }}
                    >
                        {[
                            { value: '–27%', label: 'FACTURA MEDIA' },
                            { value: '1,2 GWh', label: 'COMPARTIDOS' },
                            { value: '2 480', label: 'VECINOS' },
                        ].map((s) => (
                            <div key={s.label}>
                                <div className="serif text-3xl" style={{ color: 'var(--amber)' }}>{s.value}</div>
                                <div className="mono-label mt-1" style={{ color: 'var(--cream)', opacity: 0.4 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

Login.layout = () => null;
