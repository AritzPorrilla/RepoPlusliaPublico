<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class CifVerificationService
{
    private const CONTROL_LETTERS = 'JABCDEFGHI';

    /** Letters that require a letter control character */
    private const LETTER_ONLY = ['P', 'Q', 'R', 'S', 'W'];

    /** Letters that require a digit control character */
    private const DIGIT_ONLY = ['A', 'B', 'E', 'H'];

    /**
     * Official CIF letter → legal form name (AEAT/Registro Mercantil classification).
     *
     * @var array<string, string>
     */
    private const LEGAL_FORMS = [
        'A' => 'Sociedad Anónima',
        'B' => 'Sociedad de Responsabilidad Limitada',
        'C' => 'Sociedad Colectiva',
        'D' => 'Sociedad Comanditaria',
        'E' => 'Comunidad de Bienes',
        'F' => 'Sociedad Cooperativa',
        'G' => 'Asociación / Fundación',
        'H' => 'Comunidad de Propietarios',
        'J' => 'Sociedad Civil',
        'N' => 'Entidad extranjera',
        'P' => 'Corporación Local',
        'Q' => 'Organismo Público',
        'R' => 'Congregación o Institución Religiosa',
        'S' => 'Órgano de la Administración',
        'U' => 'Unión Temporal de Empresas',
        'V' => 'Sociedad Agraria de Transformación u otro tipo',
        'W' => 'Establecimiento permanente de entidad no residente',
    ];

    /**
     * CIF first letters whose entity types are eligible to create an energy community
     * under RD 244/2019 and Ley 24/2013 (must have legal personality, private sector).
     */
    private const VALID_ENERGY_COMMUNITY_TYPES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'N', 'U', 'V'];

    /**
     * Validate any Spanish tax ID (CIF, NIF, or NIE) using the official checksum algorithm.
     */
    public function validateChecksum(string $nif): bool
    {
        $nif = strtoupper(trim($nif));

        // NIF — 8 digits + letter
        if (preg_match('/^[0-9]{8}[A-Z]$/', $nif)) {
            return $nif[8] === 'TRWAGMYFPDXBNJZSQVHLCKE'[(int) substr($nif, 0, 8) % 23];
        }

        // NIE — X/Y/Z + 7 digits + letter
        if (preg_match('/^[XYZ][0-9]{7}[A-Z]$/', $nif)) {
            $prefix = ['X' => '0', 'Y' => '1', 'Z' => '2'][$nif[0]];

            return $nif[8] === 'TRWAGMYFPDXBNJZSQVHLCKE'[(int) ($prefix.substr($nif, 1, 7)) % 23];
        }

        // CIF — letter + 7 digits + control (digit or letter)
        if (! preg_match('/^([A-HJNP-SUVW])([0-9]{7})([0-9A-J])$/i', $nif, $m)) {
            return false;
        }

        [, $letter, $digits, $control] = $m;
        $letter = strtoupper($letter);
        $control = strtoupper($control);

        $sumOddPos = 0;
        $sumEvenPos = 0;

        for ($i = 0; $i < 7; $i++) {
            $d = (int) $digits[$i];
            if ($i % 2 === 0) {
                $d *= 2;
                $sumEvenPos += $d > 9 ? intdiv($d, 10) + ($d % 10) : $d;
            } else {
                $sumOddPos += $d;
            }
        }

        $controlDigit = (10 - (($sumOddPos + $sumEvenPos) % 10)) % 10;
        $controlLetter = self::CONTROL_LETTERS[$controlDigit];

        if (in_array($letter, self::LETTER_ONLY)) {
            return $control === $controlLetter;
        }

        if (in_array($letter, self::DIGIT_ONLY)) {
            return $control === (string) $controlDigit;
        }

        return $control === $controlLetter || $control === (string) $controlDigit;
    }

    /**
     * Look up a CIF using the BOE/BORME open data service (free, no API key required).
     *
     * Determines the legal form from the CIF's first letter (AEAT classification) and
     * verifies the entity type is eligible for a Spanish energy community. Then performs a
     * best-effort search in BORME Section II (public announcements) via the BOE website.
     *
     * Because the BOE open data API only exposes daily PDF summaries — no per-CIF search
     * exists in Section I (Actos inscritos) — `found` is set to true whenever the CIF type
     * is valid for an energy community and the BOE service responds successfully. The legal
     * form name is always returned in `status`.
     *
     * @return array{found: bool, name: string|null, status: string|null, founded: string|null, province: string|null, municipality: string|null, address: string|null, cnae: string|null, cnae_label: string|null, api_error: bool}
     */
    public function lookupRegistry(string $nif): array
    {
        $nif = strtoupper(trim($nif));

        return Cache::remember("cif_borme_{$nif}", now()->addHours(24), function () use ($nif) {
            $base = [
                'found' => false,
                'name' => null,
                'status' => null,
                'founded' => null,
                'province' => null,
                'municipality' => null,
                'address' => null,
                'cnae' => null,
                'cnae_label' => null,
                'api_error' => false,
            ];

            // NIF/NIE are personal identifiers — legal entities use CIF
            if (! preg_match('/^([A-HJNP-SUVW])([0-9]{7})([0-9A-J])$/i', $nif)) {
                return $base;
            }

            $letter = strtoupper($nif[0]);
            $legalForm = self::LEGAL_FORMS[$letter] ?? 'Entidad jurídica';

            if (! in_array($letter, self::VALID_ENERGY_COMMUNITY_TYPES)) {
                return array_merge($base, ['status' => $legalForm]);
            }

            // Search BORME Section II (public announcements) via the BOE website.
            // This endpoint is the only publicly searchable BORME content; Section I
            // (Actos inscritos — constitutions, amendments) is only available as PDFs.
            try {
                $name = $this->searchBormeAnnouncements($nif);
            } catch (\Exception) {
                return array_merge($base, ['api_error' => true, 'status' => $legalForm]);
            }

            return [
                'found' => true,
                'name' => $name,
                'status' => $legalForm,
                'founded' => null,
                'province' => null,
                'municipality' => null,
                'address' => null,
                'cnae' => null,
                'cnae_label' => null,
                'api_error' => false,
            ];
        });
    }

    /**
     * Search for a CIF in BORME Section II (public announcements) via the BOE website.
     * Returns the company name if found in an announcement title, or null otherwise.
     * Throws on network/HTTP failure so the caller can set api_error.
     */
    private function searchBormeAnnouncements(string $nif): ?string
    {
        $response = Http::timeout(8)
            ->withHeaders(['User-Agent' => 'Mozilla/5.0 (compatible; pluslia/1.0)'])
            ->get('https://www.boe.es/buscar/anborme.php', [
                'campo[0]' => 'TITULO',
                'dato[0]' => '',
                'campo[1]' => 'DOC',
                'dato[1]' => $nif,
                'campo[2]' => 'NBO',
                'dato[2]' => '',
                'accion' => 'Buscar',
                'page_hits' => '3',
            ]);

        if (! $response->ok()) {
            throw new \RuntimeException("BOE BORME returned HTTP {$response->status()}");
        }

        $html = $response->body();

        if (str_contains($html, 'No se han encontrado documentos')) {
            return null;
        }

        // Extract the first result title — typically "COMPANY NAME, S.L." or similar.
        // The result list uses <span class="titulo"> or plain <strong> inside an <li>.
        if (preg_match('/<span[^>]*class="[^"]*titulo[^"]*"[^>]*>\s*([^<]{3,120})\s*</', $html, $m)) {
            return trim(html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        }

        if (preg_match('/<li[^>]*class="[^"]*resultado[^"]*"[^>]*>.*?<strong>([^<]{3,120})<\/strong>/si', $html, $m)) {
            return trim(html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        }

        // Found results but couldn't parse the name — still a positive signal
        return null;
    }
}
