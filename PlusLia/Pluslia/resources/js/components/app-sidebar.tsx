import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Building2, CreditCard, FileText, Home, LayoutGrid, Map, MessageCircle, Network, Search, Settings, ShoppingCart, Users, Vote, Wrench } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard, map } from '@/routes';
import { waveshare as devicesWaveshare } from '@/routes/devices';
import { index as adminCommunitiesIndex } from '@/routes/admin/communities';
import { chat as communityChat } from '@/routes/community';
import { show as diagnosisShow } from '@/routes/community/diagnosis';
import { index as documentsIndex } from '@/routes/community/documents';
import { index as feesIndex } from '@/routes/community/fees';
import { index as maintenanceIndex } from '@/routes/community/maintenance';
import { index as pollsIndex } from '@/routes/community/polls';
import { index as marketplaceIndex } from '@/routes/marketplace';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Mi hogar',
        href: '/home',
        icon: Home,
    },
    {
        title: 'Marketplace P2P',
        href: marketplaceIndex(),
        icon: ShoppingCart,
    },
    {
        title: 'Mapa comunidad',
        href: map(),
        icon: Map,
    },
    {
        title: 'Config. Waveshare',
        href: devicesWaveshare(),
        icon: Network,
    },
];

const communityNavItems: NavItem[] = [
    {
        title: 'Diagnóstico',
        href: diagnosisShow(),
        icon: Search,
    },
    {
        title: 'Chat',
        href: communityChat(),
        icon: MessageCircle,
    },
    {
        title: 'Votaciones',
        href: pollsIndex(),
        icon: Vote,
    },
    {
        title: 'Documentos',
        href: documentsIndex(),
        icon: FileText,
    },
    {
        title: 'Mantenimiento',
        href: maintenanceIndex(),
        icon: Wrench,
    },
];

const adminNavItems: NavItem[] = [
    {
        title: 'Panel admin',
        href: '/admin',
        icon: LayoutGrid,
    },
    {
        title: 'Comunidades',
        href: adminCommunitiesIndex(),
        icon: Building2,
    },
    {
        title: 'Usuarios',
        href: '/admin/users',
        icon: Users,
    },
];

const communityAdminNavItems: NavItem[] = [
    {
        title: 'Mi comunidad',
        href: '/my-community',
        icon: Settings,
    },
    {
        title: 'Cuotas y pagos',
        href: feesIndex(),
        icon: CreditCard,
    },
];

interface CommunityShared {
    name: string;
    invite_code: string;
    members_count: number;
}

export function AppSidebar() {
    const { auth, community } = usePage<{
        auth: { isAdmin: boolean; isCommunityAdmin: boolean; isCommunityMember: boolean };
        community: CommunityShared | null;
    }>().props;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                {(auth.isCommunityAdmin || auth.isCommunityMember) && (
                    <NavMain items={communityNavItems} label="Mi comunidad" />
                )}
                {auth.isCommunityAdmin && (
                    <NavMain items={communityAdminNavItems} label="Gestión" />
                )}
                {auth.isAdmin && (
                    <NavMain items={adminNavItems} label="Administración" />
                )}
            </SidebarContent>

            <SidebarFooter>
                {community && (
                    <div
                        className="mx-2 mb-1 rounded-xl px-3 py-2.5 group-data-[collapsible=icon]:hidden"
                        style={{ background: 'var(--cream-2)', border: '1px solid var(--line)' }}
                    >
                        <div className="mono-label mb-1" style={{ opacity: 0.5 }}>COMUNIDAD</div>
                        <div className="text-sm font-semibold leading-tight">{community.name}</div>
                        <div className="mono-label mt-0.5">
                            {community.invite_code} · {community.members_count} vecinos
                        </div>
                    </div>
                )}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
