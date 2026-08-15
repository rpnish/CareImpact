import re
from datetime import datetime, date
from typing import Dict, Any, Optional, Tuple

# TODO: priorityScore is a placeholder (always 0). Real prioritization
# logic (e.g. distance to next star cutpoint, measure weight, condition
# severity) will be added later. Do not assume any scoring behavior yet.

# Measurement window constants per NCQA HEDIS MY2026 / CMS Star Ratings spec
REFERENCE_TODAY = date(2026, 8, 14)
MEASUREMENT_YEAR_START = date(2025, 8, 14)
# Eye exam lookback: 24 months rolling window (starting 2024-08-14)
EYE_EXAM_LOOKBACK = date(2024, 8, 14)
# Flu season lookback: July 1 of prior year (2024-07-01) to end of measurement year (2026-08-14)
FLU_SEASON_LOOKBACK = date(2024, 7, 1)

def parse_date(date_val: Any) -> Optional[date]:
    """Safely parse various date formats into a date object."""
    if not date_val or date_val in ("null", "None", "", "nan", "NaT"):
        return None
    if isinstance(date_val, datetime):
        return date_val.date()
    if isinstance(date_val, date):
        return date_val
    
    date_str = str(date_val).strip().split(" ")[0].split("T")[0]
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%Y/%m/%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return None

def parse_bp(bp_val: Any) -> Tuple[Optional[float], Optional[float]]:
    """Parse blood pressure string like '120/80' into (systolic, diastolic)."""
    if not bp_val or bp_val in ("null", "None", "", "nan"):
        return None, None
    bp_str = str(bp_val).strip()
    match = re.search(r'(\d{2,3})\s*/\s*(\d{2,3})', bp_str)
    if match:
        try:
            return float(match.group(1)), float(match.group(2))
        except ValueError:
            return None, None
    return None, None

def evaluate_member_measures(raw_input: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes HEDIS measure statuses, overallStatus, and priorityScore for a member.
    Single shared source of truth called from:
      1. CSV Ingestion
      2. POST /members
      3. PUT /members/{id}
    """
    # Extract condition flags (support bools, strings "true"/"false", 1/0)
    has_diabetes_raw = raw_input.get("has_diabetes")
    if isinstance(has_diabetes_raw, str):
        has_diabetes = has_diabetes_raw.strip().lower() in ("true", "1", "yes", "t")
    else:
        has_diabetes = bool(has_diabetes_raw)

    has_hypertension_raw = raw_input.get("has_hypertension")
    if isinstance(has_hypertension_raw, str):
        has_hypertension = has_hypertension_raw.strip().lower() in ("true", "1", "yes", "t")
    else:
        has_hypertension = bool(has_hypertension_raw)

    # 1. Diabetic Eye Exam (EED)
    # NCQA HEDIS: Not eligible if not diabetic. Compliant if exam within last 24 months. Else gap.
    raw_exam_date = raw_input.get("last_exam_date")
    parsed_exam_date = parse_date(raw_exam_date)
    formatted_exam_date = parsed_exam_date.strftime("%Y-%m-%d") if parsed_exam_date else (str(raw_exam_date) if raw_exam_date and str(raw_exam_date).strip() not in ("nan", "None", "") else None)

    if not has_diabetes:
        eye_status = "not_eligible"
        eye_value = formatted_exam_date if formatted_exam_date else None
    else:
        if parsed_exam_date and parsed_exam_date >= EYE_EXAM_LOOKBACK:
            eye_status = "compliant"
        else:
            eye_status = "gap"
        eye_value = formatted_exam_date

    # 2. Blood Pressure Control (CBP)
    # NCQA HEDIS: Not eligible if not hypertensive. Compliant if systolic < 140 AND diastolic < 90 in window. Else gap.
    raw_bp = raw_input.get("last_bp_reading")
    sys_val, dia_val = parse_bp(raw_bp)
    formatted_bp = f"{int(sys_val)}/{int(dia_val)}" if (sys_val is not None and dia_val is not None) else (str(raw_bp).strip() if raw_bp and str(raw_bp).strip() not in ("nan", "None", "") else None)

    if not has_hypertension:
        bp_status = "not_eligible"
        bp_value = formatted_bp if formatted_bp else None
    else:
        if sys_val is not None and dia_val is not None and sys_val < 140 and dia_val < 90:
            bp_status = "compliant"
        else:
            bp_status = "gap"
        bp_value = formatted_bp

    # 3. Diabetes Medication Adherence (PDC)
    # NCQA HEDIS / CMS Part D: Not eligible if not diabetic or no adherence data provided. Compliant if >= 80%. Else gap.
    raw_adherence = raw_input.get("adherence_pct")
    parsed_adherence = None
    if raw_adherence is not None and str(raw_adherence).strip() not in ("nan", "None", ""):
        try:
            parsed_adherence = round(float(raw_adherence), 1)
        except (ValueError, TypeError):
            parsed_adherence = None

    if not has_diabetes or parsed_adherence is None:
        adh_status = "not_eligible"
        adh_value = parsed_adherence
    else:
        if parsed_adherence >= 80.0:
            adh_status = "compliant"
        else:
            adh_status = "gap"
        adh_value = parsed_adherence

    # 4. Flu Vaccination (AIS-E)
    # NCQA HEDIS: Compliant if vaccinated between July 1 prior year and measurement year end. Else gap.
    raw_flu_date = raw_input.get("last_flu_shot_date")
    parsed_flu_date = parse_date(raw_flu_date)
    formatted_flu_date = parsed_flu_date.strftime("%Y-%m-%d") if parsed_flu_date else (str(raw_flu_date) if raw_flu_date and str(raw_flu_date).strip() not in ("nan", "None", "") else None)

    if parsed_flu_date and parsed_flu_date >= FLU_SEASON_LOOKBACK and parsed_flu_date <= REFERENCE_TODAY:
        flu_status = "compliant"
    else:
        flu_status = "gap"
    flu_value = formatted_flu_date

    measures = {
        "diabetic_eye_exam": {
            "status": eye_status,
            "value": eye_value
        },
        "blood_pressure_control": {
            "status": bp_status,
            "value": bp_value
        },
        "diabetes_med_adherence": {
            "status": adh_status,
            "value": adh_value
        },
        "flu_vaccination": {
            "status": flu_status,
            "value": flu_value
        }
    }

    # Classification Rule:
    # COMPLETED: Every measure is either "compliant" or "not_eligible" (no open gap anywhere)
    # PENDING: At least one measure is "gap"
    has_any_gap = any(m["status"] == "gap" for m in measures.values())
    overall_status = "pending" if has_any_gap else "completed"

    return {
        "conditions": {
            "diabetes": has_diabetes,
            "hypertension": has_hypertension
        },
        "measures": measures,
        "overallStatus": overall_status,
        "priorityScore": 0  # placeholder as specified
    }
