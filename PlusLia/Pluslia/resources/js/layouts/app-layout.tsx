import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    headerRight,
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    headerRight?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} headerRight={headerRight}>
            {children}
        </AppLayoutTemplate>
    );
}
