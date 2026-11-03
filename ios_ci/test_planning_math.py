import math


def _nonnegative(name, value):
    if value < 0:
        raise ValueError(f'{name} must be nonnegative')


def precise(cma_cm2, pma_cm2, hmi_percent, temple_score):
    _nonnegative('CMA', cma_cm2)
    _nonnegative('PMA', pma_cm2)
    if hmi_percent not in (30, 50, 70, 90):
        raise ValueError('HMI must be one of 30, 50, 70 or 90')
    _nonnegative('temple score', temple_score)
    rba = cma_cm2 + (hmi_percent / 100.0) * pma_cm2
    score = rba / 30.0 + temple_score
    return rba, score, score * 1500.0


def donor_capacity(regions):
    total = 0.0
    for area_cm2, density_fu_cm2, extraction_percent in regions:
        _nonnegative('donor area', area_cm2)
        _nonnegative('donor density', density_fu_cm2)
        if not 0 <= extraction_percent <= 100:
            raise ValueError('extraction percentage must be between 0 and 100')
        total += area_cm2 * density_fu_cm2 * extraction_percent / 100.0
    return total


def planned_fu(cma_cm2, pma_cm2, density_cma, density_pma, precise_reference_fu, safe_donor_fu=None):
    for name, value in [('CMA', cma_cm2), ('PMA', pma_cm2), ('CMA density', density_cma), ('PMA density', density_pma), ('PRECISE reference', precise_reference_fu)]:
        _nonnegative(name, value)
    density_target = cma_cm2 * density_cma + pma_cm2 * density_pma
    requested = max(density_target, precise_reference_fu)
    if safe_donor_fu is not None:
        _nonnegative('safe donor capacity', safe_donor_fu)
        requested = min(requested, safe_donor_fu)
    return requested


def test_precise_reference():
    rba, score, fu = precise(30, 60, 50, 1)
    assert math.isclose(rba, 60)
    assert math.isclose(score, 3)
    assert math.isclose(fu, 4500)


def test_hmi_options():
    assert math.isclose(precise(10, 100, 30, 0)[0], 40)
    assert math.isclose(precise(10, 100, 50, 0)[0], 60)
    assert math.isclose(precise(10, 100, 70, 0)[0], 80)
    assert math.isclose(precise(10, 100, 90, 0)[0], 100)


def test_zero_case():
    assert precise(0, 0, 30, 0) == (0, 0, 0)
    assert donor_capacity([(0, 0, 0)]) == 0


def test_donor_capacity_three_regions():
    cap = donor_capacity([(20, 70, 20), (30, 80, 25), (20, 70, 20)])
    assert math.isclose(cap, 1160)


def test_plan_limited_by_donor():
    _, _, reference = precise(30, 60, 50, 1)
    assert planned_fu(30, 60, 40, 30, reference, 3500) == 3500


def test_plan_without_donor_limit():
    _, _, reference = precise(30, 60, 50, 1)
    assert planned_fu(30, 60, 40, 30, reference) == 4500


def test_invalid_ranges_rejected():
    bad_calls = [
        lambda: precise(-1, 10, 50, 0),
        lambda: precise(10, 10, 0, 0),
        lambda: precise(10, 10, 100, 0),
        lambda: donor_capacity([(10, 60, -1)]),
        lambda: donor_capacity([(10, 60, 101)]),
        lambda: planned_fu(10, 10, 30, 30, 1000, -1),
    ]
    for call in bad_calls:
        try:
            call()
        except ValueError:
            continue
        raise AssertionError('invalid input accepted')


if __name__ == '__main__':
    tests = [v for k, v in sorted(globals().items()) if k.startswith('test_') and callable(v)]
    for test in tests:
        test()
    print(f'{len(tests)} planning math tests passed')
