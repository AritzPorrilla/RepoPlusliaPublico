<?php

use App\Rules\ValidCups;
use Illuminate\Support\Facades\Validator;

it('accepts a valid CUPS', function () {
    $v = Validator::make(['cups' => 'ES0021000000000000AB1'], ['cups' => [new ValidCups]]);

    expect($v->passes())->toBeTrue();
});

it('rejects a CUPS missing the ES prefix', function () {
    $v = Validator::make(['cups' => 'PT0021000000000000AB1'], ['cups' => [new ValidCups]]);

    expect($v->fails())->toBeTrue();
});

it('rejects a CUPS with wrong digit count', function () {
    $v = Validator::make(['cups' => 'ES002100000000000AB1'], ['cups' => [new ValidCups]]);

    expect($v->fails())->toBeTrue();
});

it('rejects a CUPS with lowercase letter block', function () {
    $v = Validator::make(['cups' => 'ES0021000000000000ab1'], ['cups' => [new ValidCups]]);

    expect($v->fails())->toBeTrue();
});

it('rejects a CUPS ending with a letter instead of a digit', function () {
    $v = Validator::make(['cups' => 'ES0021000000000000ABC'], ['cups' => [new ValidCups]]);

    expect($v->fails())->toBeTrue();
});
