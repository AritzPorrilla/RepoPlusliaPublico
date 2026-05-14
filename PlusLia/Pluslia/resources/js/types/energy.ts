export type DailyAggregate = {
    day: string;
    produced_kwh: string;
    consumed_kwh: string;
    grid_exported_kwh: string;
    grid_imported_kwh: string;
};

export type MonthlySettlement = {
    id: number;
    month: string;
    total_imported_kwh: string;
    total_exported_kwh: string;
    total_p2p_buy_kwh: string;
    total_p2p_sell_kwh: string;
    balance_eur: string;
    excedente_perdido_eur: string;
    pdf_path: string | null;
};

export type P2pOffer = {
    id: number;
    producer_id: number;
    producer?: { id: number; name: string };
    price_eur_kwh: string;
    kwh_available: string;
    valid_until: string;
    status: 'active' | 'fulfilled' | 'cancelled';
};

export type CommunityMember = {
    id: number;
    name: string;
    lat: number;
    lon: number;
    peak_power_kwp: number | null;
    is_me: boolean;
};

export type Community = {
    id: number;
    name: string;
    centroid_lat?: number;
    centroid_lon?: number;
};
