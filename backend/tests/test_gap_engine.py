import pytest
from app.gap_engine import evaluate_member_measures

def test_non_diabetic_non_hypertensive_all_not_eligible_except_flu():
    raw = {
        "has_diabetes": False,
        "has_hypertension": False,
        "last_exam_date": None,
        "last_bp_reading": None,
        "adherence_pct": None,
        "last_flu_shot_date": "2026-02-18"
    }
    result = evaluate_member_measures(raw)
    
    assert result["measures"]["diabetic_eye_exam"]["status"] == "not_eligible"
    assert result["measures"]["blood_pressure_control"]["status"] == "not_eligible"
    assert result["measures"]["diabetes_med_adherence"]["status"] == "not_eligible"
    assert result["measures"]["flu_vaccination"]["status"] == "compliant"
    assert result["overallStatus"] == "completed"
    assert result["priorityScore"] == 0

def test_diabetic_eye_exam_compliance():
    # Compliant: Within 24 months (e.g. 2025-10-10 or 2024-09-01)
    res_compliant = evaluate_member_measures({
        "has_diabetes": True,
        "has_hypertension": False,
        "last_exam_date": "2025-10-10",
        "last_bp_reading": None,
        "adherence_pct": 90.0,
        "last_flu_shot_date": "2026-01-15"
    })
    assert res_compliant["measures"]["diabetic_eye_exam"]["status"] == "compliant"
    assert res_compliant["overallStatus"] == "completed"

    # Gap: Older than 24 months (e.g. 2023-01-01)
    res_gap = evaluate_member_measures({
        "has_diabetes": True,
        "has_hypertension": False,
        "last_exam_date": "2023-01-01",
        "last_bp_reading": None,
        "adherence_pct": 90.0,
        "last_flu_shot_date": "2026-01-15"
    })
    assert res_gap["measures"]["diabetic_eye_exam"]["status"] == "gap"
    assert res_gap["overallStatus"] == "pending"

def test_hypertension_bp_control():
    # Compliant: < 140 and < 90
    res_comp = evaluate_member_measures({
        "has_diabetes": False,
        "has_hypertension": True,
        "last_bp_reading": "118/78",
        "last_flu_shot_date": "2026-01-15"
    })
    assert res_comp["measures"]["blood_pressure_control"]["status"] == "compliant"
    assert res_comp["overallStatus"] == "completed"

    # Gap: Systolic >= 140
    res_sys_gap = evaluate_member_measures({
        "has_diabetes": False,
        "has_hypertension": True,
        "last_bp_reading": "142/80",
        "last_flu_shot_date": "2026-01-15"
    })
    assert res_sys_gap["measures"]["blood_pressure_control"]["status"] == "gap"
    assert res_sys_gap["overallStatus"] == "pending"

    # Gap: Diastolic >= 90
    res_dia_gap = evaluate_member_measures({
        "has_diabetes": False,
        "has_hypertension": True,
        "last_bp_reading": "125/92",
        "last_flu_shot_date": "2026-01-15"
    })
    assert res_dia_gap["measures"]["blood_pressure_control"]["status"] == "gap"
    assert res_dia_gap["overallStatus"] == "pending"

def test_diabetes_med_adherence():
    # Compliant: >= 80%
    res_comp = evaluate_member_measures({
        "has_diabetes": True,
        "has_hypertension": False,
        "last_exam_date": "2026-01-01",
        "adherence_pct": 80.0,
        "last_flu_shot_date": "2026-01-01"
    })
    assert res_comp["measures"]["diabetes_med_adherence"]["status"] == "compliant"

    # Gap: < 80%
    res_gap = evaluate_member_measures({
        "has_diabetes": True,
        "has_hypertension": False,
        "last_exam_date": "2026-01-01",
        "adherence_pct": 79.9,
        "last_flu_shot_date": "2026-01-01"
    })
    assert res_gap["measures"]["diabetes_med_adherence"]["status"] == "gap"
    assert res_gap["overallStatus"] == "pending"

def test_flu_vaccination():
    # Gap: Date is before July 1, 2024
    res_old = evaluate_member_measures({
        "has_diabetes": False,
        "has_hypertension": False,
        "last_flu_shot_date": "2023-11-01"
    })
    assert res_old["measures"]["flu_vaccination"]["status"] == "gap"
    assert res_old["overallStatus"] == "pending"

    # Compliant: Date between 2024-07-01 and 2026-08-14
    res_new = evaluate_member_measures({
        "has_diabetes": False,
        "has_hypertension": False,
        "last_flu_shot_date": "2025-10-15"
    })
    assert res_new["measures"]["flu_vaccination"]["status"] == "compliant"
    assert res_new["overallStatus"] == "completed"
