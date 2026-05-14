import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Bienvenido a Pluslia" />
            <div className="flex min-h-screen flex-col" style={{ background: 'var(--cream)' }}>
                {/* Nav */}
                <header className="flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid var(--line)' }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--ink)' }}>
                            <svg viewBox="0 0 40 42" className="h-4 w-4" style={{ fill: 'var(--cream)' }} xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M17.2 5.63325L8.6 0.855469L0 5.63325V32.1434L16.2 41.1434L32.4 32.1434V23.699L40 19.4767V9.85547L31.4 5.07769L22.8 9.85547V18.2999L17.2 21.411V5.63325ZM38 18.2999L32.4 21.411V15.2545L38 12.1434V18.2999ZM36.9409 10.4439L31.4 13.5221L25.8591 10.4439L31.4 7.36561L36.9409 10.4439ZM24.8 18.2999V12.1434L30.4 15.2545V21.411L24.8 18.2999ZM23.8 20.0323L29.3409 23.1105L16.2 30.411L10.6591 27.3328L23.8 20.0323ZM7.6 27.9212L15.2 32.1434V38.2999L2 30.9666V7.92116L7.6 11.0323V27.9212ZM8.6 9.29991L3.05913 6.22165L8.6 3.14339L14.1409 6.22165L8.6 9.29991ZM30.4 24.8101L17.2 32.1434V38.2999L30.4 30.9666V24.8101ZM9.6 11.0323L15.2 7.92117V22.5221L9.6 25.6333V11.0323Z" />
                            </svg>
                        </div>
                        <span className="font-mono text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--ink)' }}>Pluslia</span>
                    </div>
                    <nav className="flex items-center gap-3">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="px-4 py-1.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                                style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="px-4 py-1.5 rounded-xl text-sm hover:opacity-70 transition-opacity"
                                    style={{ color: 'var(--ink)' }}
                                >
                                    Acceder
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="px-4 py-1.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                                        style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                                    >
                                        Crear cuenta
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </header>

                {/* Hero */}
                <main className="flex-1 flex flex-col items-center justify-center gap-12 px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-6 max-w-2xl">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{ background: 'var(--ink)' }}
                        >
                            <svg viewBox="0 0 40 42" className="h-8 w-8" style={{ fill: 'var(--cream)' }} xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M17.2 5.63325L8.6 0.855469L0 5.63325V32.1434L16.2 41.1434L32.4 32.1434V23.699L40 19.4767V9.85547L31.4 5.07769L22.8 9.85547V18.2999L17.2 21.411V5.63325ZM38 18.2999L32.4 21.411V15.2545L38 12.1434V18.2999ZM36.9409 10.4439L31.4 13.5221L25.8591 10.4439L31.4 7.36561L36.9409 10.4439ZM24.8 18.2999V12.1434L30.4 15.2545V21.411L24.8 18.2999ZM23.8 20.0323L29.3409 23.1105L16.2 30.411L10.6591 27.3328L23.8 20.0323ZM7.6 27.9212L15.2 32.1434V38.2999L2 30.9666V7.92116L7.6 11.0323V27.9212ZM8.6 9.29991L3.05913 6.22165L8.6 3.14339L14.1409 6.22165L8.6 9.29991ZM30.4 24.8101L17.2 32.1434V38.2999L30.4 30.9666V24.8101ZM9.6 11.0323L15.2 7.92117V22.5221L9.6 25.6333V11.0323Z" />
                            </svg>
                        </div>

                        <h1 className="serif" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 1.1, color: 'var(--ink)' }}>
                            Energía solar compartida,<br />factura compartida
                        </h1>

                        <p style={{ fontSize: '1.0625rem', color: 'oklch(0.45 0.02 60)', maxWidth: '520px' }}>
                            Pluslia conecta a los miembros de comunidades energéticas solares para monitorizar producción, repartir excedentes y reducir la factura eléctrica juntos.
                        </p>

                        <div className="flex gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                                    style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                                >
                                    Ir al dashboard
                                </Link>
                            ) : (
                                <>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                                            style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                                        >
                                            Empezar gratis
                                        </Link>
                                    )}
                                    <Link
                                        href={login()}
                                        className="px-6 py-3 rounded-xl border text-sm font-medium hover:opacity-70 transition-opacity"
                                        style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
                                    >
                                        Acceder
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Feature pills */}
                    <div className="flex flex-wrap justify-center gap-3">
                        {[
                            { icon: '☀', label: 'Producción solar en tiempo real' },
                            { icon: '⚡', label: 'Precio PVPC horario' },
                            { icon: '🏘', label: 'Reparto entre vecinos' },
                            { icon: '📊', label: 'Ahorro estimado mensual' },
                        ].map(({ icon, label }) => (
                            <div
                                key={label}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                                style={{ background: 'var(--cream-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                            >
                                <span>{icon}</span>
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>
                </main>

                <footer className="px-8 py-5 mono-label text-center" style={{ borderTop: '1px solid var(--line)' }}>
                    © 2025 Pluslia · Comunidades de energía renovable
                </footer>
            </div>
        </>
    );
}
