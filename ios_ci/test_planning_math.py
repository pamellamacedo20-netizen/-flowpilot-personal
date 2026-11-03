import math


def precise(cma_cm2, pma_cm2, hmi_percent, temple_score):
    rba = cma_cm2 + (hmi_percent / 100.0) * pma_cm2
    score = rba / 30.0 + temple_score
    return rba, score, score * 1500.0


def donor_capacity(regions):
    total = 0.0
    for area_cm2, density_fu_cm2, extraction_percent in regions:
        assert area_cm2 >= 0
        assert density_fu_cm2 >= 0
        assert 0 <= extraction_percent <= 100
        total += area_cm2 * density_fu_cm2 * extraction_percent / 100.0
    return total


def planned_fu(cma_cm2, pma_cm2, density_cma, density_pma, precise_reference_fu, safe_donor_fu=None):
    density_target = cma_cm2 * density_cma + pma_cm2 * density_pma
    requested = max(density_target, precise_reference_fu)
    return min(requested, safe_donor_fu) if safe_donor_fu is not None else requested


def test_precise_reference():
    rba, score, fu = precise(30, 60, 50, 1)
    assert math.isclose(rba, 60)
    assert math.isclose(score, 3)
    assert math.isclose(fu, 4500)


def test_hmi_extremes():
    assert math.isclose(precise(10, 100, 0, 0)[0], 10)
    assert math.isclose(precise(10, 100, 100, 0)[0], 110)


def test_zero_case():
    assert precise(0, 0, 0, 0) == (0, 0, 0)
    assert donor_capacity([(0, 0, 0)]) == 0


def test_donor_capacity_three_regions():
    cap = donor_capacity([(20, 70, 20), (30, 80, 25), (20, 70, 20)])
    assert math.isclose(cap, 1160)


def test_plan_limited_by_donor():
    _, _, reference = precise(30, 60, 50, 1)
    assert planned_fu(30, 60, 40, 30, reference, 3500) == 3500


def test_plan_without_donor_limit():
    _, _, reference = precise(30, 60, 50, 1)
    # Density target = 3000; PRECISE reference = 4500.
    assert planned_fu(30, 60, 40, 30, reference) == 4500


def test_invalid_extraction_rejected():
    for bad in (-1, 101):
        try:
            donor_capacity([(10, 60, bad)])
            raise AssertionError('invalid extraction percentage accepted')
        except AssertionError as exc:
            if str(exc) == 'invalid extraction percentage accepted':
                raise


if __name__ == '__main__':
    tests = [v for k, v in sorted(globals().items()) if k.startswith('test_') and callable(v)]
    for test in tests:
        test()
    print(f'{len(tests)} planning math tests passed')
