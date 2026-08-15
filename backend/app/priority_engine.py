"""
Dynamic CMS Star + Measure-First Priority Engine.

CMS cutoffs are loaded from the actual CMS Part C cut-point CSV at runtime.
No CMS threshold is hard-coded in the priority logic.
"""

from __future__ import annotations
from pathlib import Path
from typing import Any, Dict, List, Optional
import os
import re
from datetime import datetime, date
import csv

# Measure codes mapping:
# C03: Annual Flu Vaccine
# C11 / C12: Diabetic Eye Exam (EED)
# C14: Controlling High Blood Pressure (CBP)
GAP_COLUMNS = {
    "C03": "flu_vaccination_status",
    "C11": "diabetic_eye_exam_status",
    "C12": "diabetic_eye_exam_status",
    "C14": "blood_pressure_control_status",
}

REFERENCE_TODAY = date(2026, 8, 14)

def _extract_numbers(text: Any) -> List[float]:
    if text is None:
        return []
    return [float(x) for x in re.findall(r"\d+(?:\.\d+)?", str(text))]

def parse_star_cutoffs(threshold_values: List[Any]) -> Dict[int, Optional[float]]:
    """
    Convert CMS threshold text into lower-bound cutoffs.

    Example:
      "< 57 %"                  -> 1-star bucket
      ">= 57 % to < 61 %"      -> 2-star starts at 57
      ">= 61 % to < 68 %"      -> 3-star starts at 61
      ">= 68 % to < 73 %"      -> 4-star starts at 68
      ">= 73 %"                 -> 5-star starts at 73
    """
    cutoffs: Dict[int, Optional[float]] = {1: 0.0}
    for star in range(2, 6):
        if star - 1 < len(threshold_values):
            raw = threshold_values[star - 1]
            nums = _extract_numbers(raw)
            cutoffs[star] = nums[0] if nums else None
        else:
            cutoffs[star] = None
    return cutoffs

def find_cms_cutpoint_csv() -> Optional[Path]:
    candidates = [
        Path("/Users/nethra-nts0598/Documents/CTS_Hack_AI/data/Start_logic/cms/2026 Star Ratings Data Table - Part C Cut Points (Oct 8 2025).csv"),
        Path("data/Start_logic/cms/2026 Star Ratings Data Table - Part C Cut Points (Oct 8 2025).csv"),
        Path("../data/Start_logic/cms/2026 Star Ratings Data Table - Part C Cut Points (Oct 8 2025).csv"),
    ]
    for p in candidates:
        if p.exists():
            return p
    return None

def load_cms_cutoffs(
    csv_path: Optional[str | Path] = None,
    measure_codes: Optional[List[str]] = None,
) -> Dict[str, Dict[str, Any]]:
    """
    Read the CMS cut-point file and extract measure thresholds dynamically.
    """
    if csv_path is None:
        csv_path = find_cms_cutpoint_csv()

    if measure_codes is None:
        measure_codes = ["C03", "C11", "C14"]

    # Fallback default if file is missing
    default_config = {
        "C03": {
            "measure_name": "C03: Annual Flu Vaccine",
            "period": "03/2025 – 05/2025",
            "raw_thresholds": ["< 57", ">= 57 to < 61", ">= 61 to < 68", ">= 68 to < 73", ">= 73"],
            "cutoffs": {1: 0.0, 2: 57.0, 3: 61.0, 4: 68.0, 5: 73.0}
        },
        "C11": {
            "measure_name": "C11: Diabetes Care – Eye Exam",
            "period": "01/01/2024 – 12/31/2024",
            "raw_thresholds": ["< 60 %", ">= 60 % to < 72 %", ">= 72 % to < 80 %", ">= 80 % to < 86 %", ">= 86 %"],
            "cutoffs": {1: 0.0, 2: 60.0, 3: 72.0, 4: 80.0, 5: 86.0}
        },
        "C14": {
            "measure_name": "C14: Controlling High Blood Pressure",
            "period": "01/01/2024 – 12/31/2024",
            "raw_thresholds": ["< 67 %", ">= 67 % to < 75 %", ">= 75 % to < 80 %", ">= 80 % to < 86 %", ">= 86 %"],
            "cutoffs": {1: 0.0, 2: 67.0, 3: 75.0, 4: 80.0, 5: 86.0}
        }
    }

    if not csv_path or not Path(csv_path).exists():
        return default_config

    try:
        rows = []
        with open(csv_path, "r", encoding="utf-8-sig") as f:
            reader = csv.reader(f)
            for row in reader:
                rows.append(row)

        if len(rows) < 9:
            return default_config

        measure_row = rows[2]
        period_row = rows[3]

        result: Dict[str, Dict[str, Any]] = {}
        for code in measure_codes:
            matches = [col for col, val in enumerate(measure_row) if code in str(val)]
            if not matches:
                # If C12 searched but file has C11, fallback
                if code == "C12":
                    matches = [col for col, val in enumerate(measure_row) if "C11" in str(val)]
            if matches:
                col_idx = matches[0]
                raw_thresholds = [rows[r][col_idx] for r in range(4, 9) if col_idx < len(rows[r])]
                result[code] = {
                    "measure_name": str(measure_row[col_idx]),
                    "period": str(period_row[col_idx]),
                    "raw_thresholds": raw_thresholds,
                    "cutoffs": parse_star_cutoffs(raw_thresholds),
                }
            else:
                result[code] = default_config.get(code, default_config["C03"])
        return result
    except Exception:
        return default_config

def calculate_star(performance_pct: float, cutoffs: Dict[int, Optional[float]]) -> int:
    """Assign the star from current performance using dynamic cutoffs."""
    if performance_pct is None:
        return 0
    star = 1
    for level in range(2, 6):
        cutoff = cutoffs.get(level)
        if cutoff is not None and performance_pct >= cutoff:
            star = level
        else:
            break
    return star

def get_next_star(performance_pct: float, cutoffs: Dict[int, Optional[float]]) -> Dict[str, Optional[float]]:
    """Return current star, next star target, cutoff, and distance."""
    current = calculate_star(performance_pct, cutoffs)
    if current >= 5:
        return {
            "current_star": 5,
            "next_star": None,
            "next_cutoff": None,
            "distance": 0.0,
        }

    next_level = current + 1
    next_cutoff = cutoffs.get(next_level)
    if next_cutoff is None:
        return {
            "current_star": current,
            "next_star": None,
            "next_cutoff": None,
            "distance": None,
        }

    return {
        "current_star": current,
        "next_star": next_level,
        "next_cutoff": next_cutoff,
        "distance": max(0.0, next_cutoff - performance_pct),
    }

def build_measure_priority(
    measure_summary: List[Dict[str, Any]],
    cms_config: Dict[str, Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Measure-first priority:
      1. Highest next-star target.
      2. For the same target star, smallest improvement needed (distance_to_target).
      3. Higher current performance as final tie-breaker.
    """
    rows = []
    for item in measure_summary:
        code = str(item["measure_code"])
        perf = float(item["performance_pct"])
        
        cfg = cms_config.get(code)
        if not cfg:
            continue

        info = get_next_star(perf, cfg["cutoffs"])
        dist = info["distance"]

        rows.append({
            "measure_code": code,
            "measure_key": item.get("measure_key", ""),
            "measure_name": item.get("measure_name", cfg["measure_name"]),
            "current_pct": round(perf, 2),
            "current_star": info["current_star"],
            "target_star": info["next_star"],
            "target_pct": info["next_cutoff"],
            "distance_to_target": round(dist, 2) if dist is not None else None,
            "raw_cms_thresholds": cfg["raw_thresholds"],
            "eligible_count": item.get("eligible_count", 0),
            "compliant_count": item.get("compliant_count", 0),
            "gap_count": item.get("gap_count", 0),
        })

    # Sort: target_star (desc), distance_to_target (asc), current_pct (desc)
    def sort_key(r):
        has_target = 1 if r["target_star"] is not None else 0
        target_star = r["target_star"] or 0
        dist = r["distance_to_target"] if r["distance_to_target"] is not None else 999.0
        curr_pct = r["current_pct"] or 0.0
        return (-has_target, -target_star, dist, -curr_pct)

    rows.sort(key=sort_key)
    for idx, r in enumerate(rows, start=1):
        r["measure_priority"] = idx

    return rows

def load_member_encounters() -> Dict[str, int]:
    """
    Reads encounters.csv if available to calculate days since last encounter.
    """
    encounter_file = Path("/Users/nethra-nts0598/Documents/CTS_Hack_AI/data/Start_logic/raw/encounters.csv")
    res: Dict[str, date] = {}
    if not encounter_file.exists():
        return {}

    try:
        with open(encounter_file, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                pid = row.get("PATIENT")
                start_str = (row.get("START") or "").split("T")[0]
                if pid and start_str:
                    try:
                        d = datetime.strptime(start_str, "%Y-%m-%d").date()
                        if pid not in res or d > res[pid]:
                            res[pid] = d
                    except Exception:
                        continue
        
        days_map: Dict[str, int] = {}
        for pid, last_d in res.items():
            days_map[pid] = max(0, (REFERENCE_TODAY - last_d).days)
        return days_map
    except Exception:
        return {}

def rank_members_for_target(
    members: List[Dict[str, Any]],
    target_measure_code: str,
    encounters_map: Optional[Dict[str, int]] = None,
) -> List[Dict[str, Any]]:
    """
    Once target measure is selected, rank members who can close this gap.

    Ordering:
      1. Gap in target measure (TARGET_MEASURE_GAP).
      2. Recent healthcare activity (REACHABILITY_SCORE).
      3. Total open care gaps (TOTAL_GAPS).
    """
    encounters_map = encounters_map or load_member_encounters()

    status_field = GAP_COLUMNS.get(target_measure_code, "blood_pressure_control_status")

    ranked = []
    for m in members:
        # Check target gap
        m_status = m.get(status_field)
        is_target_gap = bool(m_status == "gap")

        # Reachability based on encounters
        pid = m.get("member_id") or m.get("_id")
        days = encounters_map.get(str(pid))
        
        # Fallback to recent clinical dates if no encounter file entry
        if days is None:
            recent_dates = [
                m.get("last_exam_date"),
                m.get("last_flu_shot_date"),
            ]
            valid_days = []
            for ds in recent_dates:
                if ds:
                    try:
                        d = datetime.strptime(str(ds).split("T")[0], "%Y-%m-%d").date()
                        valid_days.append(max(0, (REFERENCE_TODAY - d).days))
                    except Exception:
                        pass
            days = min(valid_days) if valid_days else 120

        # Reachability score (20 if <=30d, 15 if <=90d, 10 if <=180d, 5 if <=365d, 0 else)
        if days <= 30:
            reachability = 20
        elif days <= 90:
            reachability = 15
        elif days <= 180:
            reachability = 10
        elif days <= 365:
            reachability = 5
        else:
            reachability = 0

        # Total open gaps
        statuses = [
            m.get("diabetic_eye_exam_status"),
            m.get("blood_pressure_control_status"),
            m.get("diabetes_med_adherence_status"),
            m.get("flu_vaccination_status"),
        ]
        total_gaps = sum(1 for s in statuses if s == "gap")

        # Priority calculation
        if is_target_gap:
            score = 60 + reachability + (total_gaps * 5)
        elif total_gaps > 0:
            score = 20 + reachability + (total_gaps * 5)
        else:
            score = 0

        m_copy = dict(m)
        m_copy["target_measure_gap"] = is_target_gap
        m_copy["reachability_score"] = reachability
        m_copy["days_since_encounter"] = days
        m_copy["total_gaps"] = total_gaps
        m_copy["priorityScore"] = score
        ranked.append(m_copy)

    # Sort descending by priorityScore, then total_gaps
    ranked.sort(
        key=lambda x: (
            1 if x["target_measure_gap"] else 0,
            x["reachability_score"],
            x["total_gaps"]
        ),
        reverse=True
    )

    return ranked

def calculate_dynamic_priority(members: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes dynamic CMS priority ranking across measures and members.
    """
    # 1. Compute current performance per measure from live members
    measure_stats = {
        "C14": {"key": "blood_pressure_control", "name": "C14: Controlling High Blood Pressure", "eligible": 0, "compliant": 0},
        "C11": {"key": "diabetic_eye_exam", "name": "C11: Diabetes Care – Eye Exam", "eligible": 0, "compliant": 0},
        "C03": {"key": "flu_vaccination", "name": "C03: Annual Flu Vaccine", "eligible": 0, "compliant": 0},
    }

    for m in members:
        # BP
        bp_s = m.get("blood_pressure_control_status")
        if bp_s in ("compliant", "gap"):
            measure_stats["C14"]["eligible"] += 1
            if bp_s == "compliant":
                measure_stats["C14"]["compliant"] += 1
        # Eye Exam
        eye_s = m.get("diabetic_eye_exam_status")
        if eye_s in ("compliant", "gap"):
            measure_stats["C11"]["eligible"] += 1
            if eye_s == "compliant":
                measure_stats["C11"]["compliant"] += 1
        # Flu
        flu_s = m.get("flu_vaccination_status")
        if flu_s in ("compliant", "gap"):
            measure_stats["C03"]["eligible"] += 1
            if flu_s == "compliant":
                measure_stats["C03"]["compliant"] += 1

    measure_summary = []
    for code, st in measure_stats.items():
        elig = st["eligible"]
        comp = st["compliant"]
        rate = round((comp / elig * 100), 1) if elig > 0 else 0.0
        measure_summary.append({
            "measure_code": code,
            "measure_key": st["key"],
            "measure_name": st["name"],
            "performance_pct": rate,
            "eligible_count": elig,
            "compliant_count": comp,
            "gap_count": elig - comp,
        })

    # 2. Load CMS cutoffs
    cms_config = load_cms_cutoffs(measure_codes=["C03", "C11", "C14"])

    # 3. Build measure priority
    measure_ranking = build_measure_priority(measure_summary, cms_config)

    # 4. Select top active priority measure
    active = [m for m in measure_ranking if m["target_star"] is not None]
    if active:
        priority_measure = active[0]
        member_ranking = rank_members_for_target(members, priority_measure["measure_code"])
    else:
        priority_measure = None
        member_ranking = members

    return {
        "cms_config": cms_config,
        "priority_measure": priority_measure,
        "measure_ranking": measure_ranking,
        "member_ranking": member_ranking,
    }
