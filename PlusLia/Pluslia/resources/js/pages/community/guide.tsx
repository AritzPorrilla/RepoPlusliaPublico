import { Head, Link } from '@inertiajs/react';
import {
    BookOpen,
    Building2,
    ChevronRight,
    ClipboardList,
    FileText,
    MessageSquare,
    Settings,
    Shield,
    Users,
    Zap,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';

const LEGAL_FORMS = [
    {
        name: 'Cooperativa',
        description: 'Modelo democrático y participativo muy habitual en comunidades energéticas.',
        badge: 'Más común',
    },
    {
        name: 'Asociación sin ánimo de lucro',
        description: 'Gestiona proyectos sociales y ambientales con estructura sencilla.',
        badge: null,
    },
    {
        name: 'Sociedad Limitada democrática (S.L.)',
        description: 'Adecuada cuando se requiere una estructura más empresarial, pero manteniendo control ciudadano.',
        badge: null,
    },
];

const STEP_ICON_COLORS = [
    { bg: 'var(--cream-2)', color: 'var(--ink)' },
    { bg: 'var(--cream-2)', color: 'var(--ink)' },
    { bg: 'var(--amber)', color: 'var(--ink)' },
    { bg: 'var(--amber)', color: 'var(--amber-deep)' },
    { bg: 'var(--green-pluslia)', color: 'var(--green-deep)' },
];

const STEPS = [
    {
        number: 1,
        icon: MessageSquare,
        title: 'Reunir un grupo motor',
        description:
            'El primer paso es formar un grupo motor: el conjunto inicial de personas interesadas en impulsar el proyecto, compartir información y coordinar los siguientes pasos.',
        items: [
            'Los usuarios registrados dentro del radio de acción de una futura comunidad energética pueden comunicarse y organizarse dentro de la plataforma.',
            'El objetivo es identificar quién quiere participar, definir roles iniciales y crear una visión común del proyecto.',
            'No se necesita un número mínimo para empezar, pero suelen ser necesarias al menos 3–5 personas comprometidas.',
        ],
    },
    {
        number: 2,
        icon: ClipboardList,
        title: 'Identificar necesidades y oportunidades',
        description:
            'La plataforma guiará al grupo motor en la realización de un diagnóstico inicial para validar la viabilidad del proyecto.',
        items: [
            'Consumo energético de los usuarios potenciales',
            'Disponibilidad de cubiertas, tejados o terrenos adecuados para instalaciones renovables',
            'Nivel de interés de los posibles socios',
            'Recursos renovables disponibles en la zona (solar, eólica y otros)',
        ],
        note: 'Esta fase permite definir si el proyecto es viable y qué tipo de instalación tendría mayor impacto.',
    },
    {
        number: 3,
        icon: Building2,
        title: 'Elegir la forma jurídica y constituir la entidad',
        description:
            'Para constituir legalmente la comunidad energética hay que seleccionar la figura jurídica más adecuada, realizar un estudio de viabilidad y redactar los estatutos. Todas las opciones cumplen la normativa española (RD 244/2019, Ley 24/2013).',
        legalForms: LEGAL_FORMS,
        items: [
            'Realizar un estudio de viabilidad técnica y económica.',
            'Redactar estatutos y normas internas.',
            'Constituir la entidad ante notario o registro competente.',
            'Obtener el NIF de la entidad.',
            'Introducir el NIF en Pluslia para crear oficialmente la Comunidad Energética.',
        ],
        note: 'Una vez constituida, la entidad obtiene personalidad jurídica propia y puede firmar contratos, abrir cuentas bancarias y gestionar la instalación.',
    },
    {
        number: 4,
        icon: Zap,
        title: 'Montaje de la instalación y alta de socios',
        description:
            'Con la entidad legal creada y los fondos de las cuotas de participación disponibles, la comunidad procede a instalar la infraestructura y a dar de alta a sus socios en la plataforma.',
        items: [
            'Instalar placas solares, baterías comunitarias y contadores inteligentes.',
            'Configurar sistemas de comunicación y monitorización.',
            'Dar de alta el Punto de Suministro (CUPS) de cada socio.',
            'Añadir nuevos socios: cada uno aporta una cuota de participación para financiar la infraestructura.',
            'Los socios no compran energía; reciben su parte del reparto energético generado por la comunidad.',
            'Conectar las APIs para mostrar consumos, producción y reparto energético en tiempo real.',
            'Gestionar los coeficientes de reparto por socio según la política elegida.',
        ],
    },
    {
        number: 5,
        icon: Settings,
        title: 'Operación y gestión continua',
        description:
            'Pluslia actúa como plataforma de control de toda la comunidad, integrando monitorización energética, administración y gobernanza democrática.',
        subsections: [
            {
                title: 'Monitorización energética',
                icon: Zap,
                items: [
                    'Producción de la instalación y reparto energético entre socios',
                    'Consumo individual y global en tiempo real',
                    'Optimización y análisis de datos',
                ],
            },
            {
                title: 'Gestión administrativa',
                icon: FileText,
                items: [
                    'Altas y bajas de socios y control de cuotas',
                    'Documentación interna y votaciones democráticas',
                    'Generación de liquidaciones mensuales',
                ],
            },
            {
                title: 'Mantenimiento y crecimiento',
                icon: Shield,
                items: [
                    'Gestión de mantenimiento preventivo y correctivo',
                    'Integración de nuevos servicios (movilidad eléctrica, baterías, eficiencia energética)',
                    'Propuestas comunitarias y ampliaciones del proyecto',
                ],
            },
        ],
    },
];

export default function CommunityGuide() {
    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard() }, { title: 'Guía comunidad energética', href: '/communities/guide' }]}>
            <Head title="Guía — Cómo crear una comunidad energética" />
            <div className="flex flex-col gap-8 p-6 max-w-4xl mx-auto">
                {/* Header */}
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--ink)' }}>
                            <BookOpen size={15} style={{ color: 'var(--cream)' }} />
                        </div>
                        <h1 className="serif text-4xl leading-tight">Guía: Comunidad Energética en España</h1>
                    </div>
                    <p className="mono-label mt-1">Desde el grupo motor hasta la operación continua — todo lo que necesitas saber.</p>
                </div>

                {/* Steps */}
                <div className="flex flex-col gap-5">
                    {STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const iconStyle = STEP_ICON_COLORS[idx];

                        return (
                            <div key={step.number} className="rounded-xl border" style={{ borderColor: 'var(--line)' }}>
                                {/* Step header */}
                                <div className="flex items-start gap-4 px-5 py-4" style={{ borderBottom: '1px solid var(--line)' }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconStyle.bg }}>
                                        <Icon size={18} style={{ color: iconStyle.color }} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="mono-label mb-0.5">Paso {step.number}</div>
                                        <div className="font-semibold text-base">{step.title}</div>
                                        <p className="mono-label mt-1">{step.description}</p>
                                    </div>
                                </div>

                                {/* Step content */}
                                <div className="px-5 py-4 flex flex-col gap-4">
                                    {/* Legal forms (step 3 only) */}
                                    {'legalForms' in step && step.legalForms && (
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            {step.legalForms.map((form) => (
                                                <div key={form.name} className="rounded-xl border p-3 flex flex-col gap-1" style={{ borderColor: 'var(--line)', background: 'var(--cream-2)' }}>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-semibold">{form.name}</p>
                                                        {form.badge && (
                                                            <span className="pill" style={{ background: 'var(--amber)', color: 'var(--ink)' }}>{form.badge}</span>
                                                        )}
                                                    </div>
                                                    <p className="mono-label">{form.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Bullet items */}
                                    {'items' in step && step.items && (
                                        <ul className="flex flex-col gap-1.5">
                                            {step.items.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm">
                                                    <ChevronRight size={14} className="mt-0.5 shrink-0" style={{ opacity: 0.4 }} />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {/* Subsections (step 5 only) */}
                                    {'subsections' in step && step.subsections && (
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            {step.subsections.map((sub) => {
                                                const SubIcon = sub.icon;
                                                return (
                                                    <div key={sub.title} className="rounded-xl border p-3 flex flex-col gap-2" style={{ borderColor: 'var(--line)', background: 'var(--cream-2)' }}>
                                                        <div className="flex items-center gap-2">
                                                            <SubIcon size={13} style={{ opacity: 0.5 }} />
                                                            <p className="text-sm font-semibold">{sub.title}</p>
                                                        </div>
                                                        <ul className="flex flex-col gap-1">
                                                            {sub.items.map((item, i) => (
                                                                <li key={i} className="flex items-start gap-1.5">
                                                                    <ChevronRight size={11} className="mt-0.5 shrink-0" style={{ opacity: 0.4 }} />
                                                                    <span className="mono-label">{item}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Note */}
                                    {'note' in step && step.note && (
                                        <p className="mono-label italic border-l-2 pl-3" style={{ borderColor: 'var(--amber-deep)' }}>
                                            {step.note}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* CTA */}
                <div className="rounded-xl p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" style={{ background: 'var(--green-pluslia)', border: '1px solid var(--green-deep)' }}>
                    <div>
                        <p className="font-semibold" style={{ color: 'var(--ink)' }}>¿Listo para empezar?</p>
                        <p className="mono-label mt-0.5" style={{ color: 'var(--green-deep)' }}>
                            Crea tu comunidad energética en Pluslia y gestiona todo desde una sola plataforma.
                        </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <Button asChild variant="outline">
                            <Link href={dashboard()}>Volver al dashboard</Link>
                        </Button>
                        <Button asChild style={{ background: 'var(--ink)', color: 'var(--cream)' }} className="hover:opacity-90">
                            <Link href="/communities/create">
                                <Users size={14} className="mr-2" />
                                Crear comunidad
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

CommunityGuide.layout = () => null;
