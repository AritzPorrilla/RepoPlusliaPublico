<?php

use App\Http\Controllers\Admin\CommunityController as AdminCommunityController;
use App\Http\Controllers\Admin\CommunityMemberController as AdminCommunityMemberController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\CommunityController;
use App\Http\Controllers\CommunityDiagnosisController;
use App\Http\Controllers\CommunityDocumentController;
use App\Http\Controllers\CommunityFeeController;
use App\Http\Controllers\CommunityHubController;
use App\Http\Controllers\CommunityJoinController;
use App\Http\Controllers\CommunityMapController;
use App\Http\Controllers\CommunityPollController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MaintenanceTaskController;
use App\Http\Controllers\MarketplaceController;
use App\Http\Controllers\MyCommunityController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\WaveshareConfigController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('marketplace', [MarketplaceController::class, 'index'])->name('marketplace.index');
    Route::post('marketplace', [MarketplaceController::class, 'store'])->name('marketplace.store');
    Route::patch('marketplace/{offer}', [MarketplaceController::class, 'update'])->name('marketplace.update');
    Route::delete('marketplace/{offer}', [MarketplaceController::class, 'destroy'])->name('marketplace.destroy');
    Route::get('map', CommunityMapController::class)->name('map');
    Route::get('onboarding', [OnboardingController::class, 'show'])->name('onboarding.show');
    Route::post('onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');

    // Waveshare RS485 configuration wizard (for technicians)
    Route::get('devices/waveshare', WaveshareConfigController::class)->name('devices.waveshare');

    // Smart home panel
    Route::get('home', HomeController::class)->name('smart-home');
    Route::post('home/device', [HomeController::class, 'registerDevice'])->name('smart-home.device.register');
    Route::delete('home/device/{device}', [HomeController::class, 'deleteDevice'])->name('smart-home.device.delete');
    Route::post('home/device/{device}/regenerate-token', [HomeController::class, 'regenerateToken'])->name('smart-home.device.regenerate-token');
    Route::patch('home/device/{device}/toggle-status', [HomeController::class, 'toggleStatus'])->name('smart-home.device.toggle-status');

    // Community creation & joining
    Route::get('communities/verify-cif', [CommunityController::class, 'verifyCif'])->name('communities.verify-cif');
    Route::get('communities/guide', [CommunityController::class, 'guide'])->name('communities.guide');
    Route::get('communities/create', [CommunityController::class, 'create'])->name('communities.create');
    Route::post('communities', [CommunityController::class, 'store'])->name('communities.store');
    Route::post('communities/join', CommunityJoinController::class)->name('communities.join');

    // Community hub (chat, polls, documents, maintenance) — all members
    Route::get('community/chat', [CommunityHubController::class, 'show'])->name('community.chat');
    Route::post('community/messages', [CommunityHubController::class, 'sendMessage'])->name('community.messages.send');

    Route::get('community/diagnosis', [CommunityDiagnosisController::class, 'show'])->name('community.diagnosis.show');
    Route::post('community/diagnosis', [CommunityDiagnosisController::class, 'store'])->name('community.diagnosis.store');

    Route::get('community/polls', [CommunityPollController::class, 'index'])->name('community.polls.index');
    Route::post('community/polls', [CommunityPollController::class, 'store'])->name('community.polls.store');
    Route::post('community/polls/{poll}/vote', [CommunityPollController::class, 'vote'])->name('community.polls.vote');
    Route::post('community/polls/{poll}/close', [CommunityPollController::class, 'close'])->name('community.polls.close');

    Route::get('community/documents', [CommunityDocumentController::class, 'index'])->name('community.documents.index');
    Route::post('community/documents', [CommunityDocumentController::class, 'store'])->name('community.documents.store');
    Route::get('community/documents/{document}/download', [CommunityDocumentController::class, 'download'])->name('community.documents.download');
    Route::delete('community/documents/{document}', [CommunityDocumentController::class, 'destroy'])->name('community.documents.destroy');

    Route::get('community/maintenance', [MaintenanceTaskController::class, 'index'])->name('community.maintenance.index');
    Route::post('community/maintenance', [MaintenanceTaskController::class, 'store'])->name('community.maintenance.store');
    Route::patch('community/maintenance/{task}', [MaintenanceTaskController::class, 'update'])->name('community.maintenance.update');
    Route::delete('community/maintenance/{task}', [MaintenanceTaskController::class, 'destroy'])->name('community.maintenance.destroy');

    // Community admin self-management
    Route::get('my-community', [MyCommunityController::class, 'show'])->name('my-community.show');
    Route::put('my-community', [MyCommunityController::class, 'update'])->name('my-community.update');
    Route::post('my-community/members', [MyCommunityController::class, 'addMember'])->name('my-community.members.add');
    Route::delete('my-community/members/{user}', [MyCommunityController::class, 'removeMember'])->name('my-community.members.remove');

    // Community fees (admin only)
    Route::get('my-community/fees', [CommunityFeeController::class, 'index'])->name('community.fees.index');
    Route::post('my-community/fees', [CommunityFeeController::class, 'storeFee'])->name('community.fees.store');
    Route::delete('my-community/fees/{fee}', [CommunityFeeController::class, 'destroyFee'])->name('community.fees.destroy');
    Route::post('my-community/fees/{fee}/payments/{userId}/paid', [CommunityFeeController::class, 'markPaid'])->name('community.fees.payments.paid');
    Route::post('my-community/fees/{fee}/payments/{userId}/unpaid', [CommunityFeeController::class, 'markUnpaid'])->name('community.fees.payments.unpaid');
});

Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', AdminDashboardController::class)->name('dashboard');
    Route::resource('communities', AdminCommunityController::class)->except('show');
    Route::post('communities/{community}/members', [AdminCommunityMemberController::class, 'store'])->name('communities.members.store');
    Route::delete('communities/{community}/members/{user}', [AdminCommunityMemberController::class, 'destroy'])->name('communities.members.destroy');
    Route::get('users', [AdminUserController::class, 'index'])->name('users.index');
    Route::post('users/{user}/toggle-admin', [AdminUserController::class, 'toggleAdmin'])->name('users.toggle-admin');
});

require __DIR__.'/settings.php';
