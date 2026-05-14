<?php

use App\Models\User;
use App\Services\CifVerificationService;
use Illuminate\Support\Facades\Http;

// JABCDEFGHI[4]='D' — control digit for F1234567 body = 4 → F12345674 and F1234567D are valid
// NIF 12345678: 12345678 % 23 = 14 → letter 'Z'

describe('CifVerificationService::validateChecksum', function () {
    beforeEach(fn () => $this->service = app(CifVerificationService::class));

    it('accepts a valid CIF with digit control', function () {
        expect($this->service->validateChecksum('F12345674'))->toBeTrue();
    });

    it('accepts a valid CIF with letter control', function () {
        // controlDigit=4 → JABCDEFGHI[4]='D'
        expect($this->service->validateChecksum('F1234567D'))->toBeTrue();
    });

    it('rejects a CIF with wrong control character', function () {
        expect($this->service->validateChecksum('F1234567E'))->toBeFalse();
    });

    it('accepts a valid Spanish NIF (DNI)', function () {
        // 12345678 % 23 = 14 → TRWAGMYFPDXBNJZSQVHLCKE[14] = 'Z'
        expect($this->service->validateChecksum('12345678Z'))->toBeTrue();
    });

    it('rejects a NIF with wrong letter', function () {
        expect($this->service->validateChecksum('12345678A'))->toBeFalse();
    });

    it('accepts a valid NIE', function () {
        $mod = (int) '01234567' % 23;
        $letter = 'TRWAGMYFPDXBNJZSQVHLCKE'[$mod];
        expect($this->service->validateChecksum("X1234567{$letter}"))->toBeTrue();
    });

    it('rejects a string with wrong format', function () {
        expect($this->service->validateChecksum('INVALID'))->toBeFalse();
    });
})->group('cif');

describe('GET /communities/verify-cif', function () {
    it('returns 422 when nif is missing', function () {
        $user = User::factory()->create();
        $this->actingAs($user)
            ->getJson('/communities/verify-cif')
            ->assertStatus(422);
    });

    it('returns checksum_valid false for bad CIF without calling BOE', function () {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/communities/verify-cif?nif=F1234567E')
            ->assertOk()
            ->assertJson(['checksum_valid' => false, 'registry' => null]);
    });

    it('returns found true with legal form for a valid cooperative CIF when BOE responds', function () {
        $user = User::factory()->create();
        Http::fake([
            'www.boe.es/buscar/anborme.php*' => Http::response(
                '<p class="caja gris info" role="alert">No se han encontrado documentos que satisfagan sus criterios de búsqueda</p>',
                200
            ),
        ]);

        $this->actingAs($user)
            ->getJson('/communities/verify-cif?nif=F12345674')
            ->assertOk()
            ->assertJson([
                'checksum_valid' => true,
                'registry' => [
                    'found' => true,
                    'status' => 'Sociedad Cooperativa',
                    'api_error' => false,
                ],
            ]);
    });

    it('returns found true with company name when BORME section II has announcements', function () {
        $user = User::factory()->create();
        Http::fake([
            'www.boe.es/buscar/anborme.php*' => Http::response(
                '<span class="titulo">COOP ENERGETICA EXAMPLE, F. COOP.</span>',
                200
            ),
        ]);

        $this->actingAs($user)
            ->getJson('/communities/verify-cif?nif=F12345674')
            ->assertOk()
            ->assertJson([
                'checksum_valid' => true,
                'registry' => [
                    'found' => true,
                    'name' => 'COOP ENERGETICA EXAMPLE, F. COOP.',
                    'status' => 'Sociedad Cooperativa',
                ],
            ]);
    });

    it('returns found false when CIF type is a public entity not valid for energy community', function () {
        $user = User::factory()->create();
        // P = Corporación Local — not a valid private energy community type
        // Control: P1234567 → sumOdd+sumEven determines control, use a known-valid one
        // We only need to verify the logic, so we mock to ensure BOE is not called
        Http::fake();

        // P-type CIF with valid checksum: P2816014H (Ayuntamiento de Madrid - example)
        // Let's just check any P-type CIF for the "not valid type" path
        // First verify checksum is valid: need a real P CIF
        $service = app(CifVerificationService::class);

        // Construct a valid P CIF for testing: P + 7 digits + valid control
        // P2300000: sumEven=0+0+0+0=0, sumOdd=2+3+0+0=5, total=5, control=(10-5%10)%10=5, letter=JABCDEFGHI[5]='F'
        // Actually let's compute: digits=2300000
        // i=0 (d=2): even pos, d*2=4, sumEven+=4
        // i=1 (d=3): odd pos, sumOdd+=3
        // i=2 (d=0): even pos, d*2=0, sumEven+=0
        // i=3 (d=0): odd pos, sumOdd+=0
        // i=4 (d=0): even pos, sumEven+=0
        // i=5 (d=0): odd pos, sumOdd+=0
        // i=6 (d=0): even pos, sumEven+=0
        // sumOdd=3, sumEven=4, total=7, control=(10-7)%10=3, letter=JABCDEFGHI[3]='C'
        expect($service->validateChecksum('P2300000C'))->toBeTrue();

        $this->actingAs($user)
            ->getJson('/communities/verify-cif?nif=P2300000C')
            ->assertOk()
            ->assertJson([
                'checksum_valid' => true,
                'registry' => [
                    'found' => false,
                    'api_error' => false,
                    'status' => 'Corporación Local',
                ],
            ]);

        Http::assertNothingSent();
    });

    it('returns api_error true when BOE service is unreachable', function () {
        $user = User::factory()->create();
        Http::fake([
            'www.boe.es/buscar/anborme.php*' => Http::response('', 503),
        ]);

        $this->actingAs($user)
            ->getJson('/communities/verify-cif?nif=F12345674')
            ->assertOk()
            ->assertJson([
                'checksum_valid' => true,
                'registry' => [
                    'api_error' => true,
                    'status' => 'Sociedad Cooperativa',
                ],
            ]);
    });

    it('requires authentication', function () {
        $this->getJson('/communities/verify-cif?nif=F12345674')
            ->assertUnauthorized();
    });
})->group('cif');
