import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from source.acupressure_engine import score_points, check_red_flag


def point_ids(result):
    return [r["point_id"] for r in result]


def test_temple_throbbing_migraine_high_severity():
    result = score_points(
        zone="Temple_Pain",
        pain_types=["Throbbing"],
        severity=8,
        history_conditions=["Migraine / Chronic Headaches"],
    )
    ids = point_ids(result)
    assert ids[0] == "TAIYANG", f"Expected TAIYANG first, got {ids}"
    assert "GB20" in ids, "GB20 should appear (secondary + boosts)"
    assert "LI4" in ids, "LI4 should appear (severity >= 7)"


def test_forehead_pressure_sinus():
    result = score_points(
        zone="Mid_Forehead_Pain",
        pain_types=["Pressure"],
        severity=5,
        history_conditions=["Sinusitis / Sinus Congestion"],
    )
    ids = point_ids(result)
    assert ids[0] == "YINTANG", f"Expected YINTANG first, got {ids}"
    assert "GB14" in ids


def test_neck_cervical_spondylosis():
    result = score_points(
        zone="Neck_Center",
        pain_types=["Constant"],
        severity=6,
        history_conditions=["Cervical Spondylosis (Neck Stiffness)"],
    )
    ids = point_ids(result)
    assert "GB21" in ids
    assert "BL10" in ids


def test_red_flag_triggers_on_severe_stabbing():
    assert check_red_flag(9, ["Sharp/Stabbing"]) is True
    assert check_red_flag(9, ["Acute (sudden)"]) is True


def test_red_flag_does_not_trigger_below_threshold():
    assert check_red_flag(8, ["Sharp/Stabbing"]) is False
    assert check_red_flag(9, ["Throbbing"]) is False
    assert check_red_flag(6, ["Acute (sudden)"]) is False


def test_ear_pain_no_history():
    result = score_points(
        zone="Ear_Pain",
        pain_types=["Dull/Aching"],
        severity=4,
        history_conditions=[],
    )
    ids = point_ids(result)
    assert ids[0] == "TB21", f"Expected TB21 first, got {ids}"
    assert "GB20" in ids


if __name__ == "__main__":
    tests = [
        test_temple_throbbing_migraine_high_severity,
        test_forehead_pressure_sinus,
        test_neck_cervical_spondylosis,
        test_red_flag_triggers_on_severe_stabbing,
        test_red_flag_does_not_trigger_below_threshold,
        test_ear_pain_no_history,
    ]
    passed = 0
    for t in tests:
        try:
            t()
            print(f"  PASS  {t.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"  FAIL  {t.__name__}: {e}")
    print(f"\n{passed}/{len(tests)} tests passed")
