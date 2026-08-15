from typing import Dict, Any, List, Optional
import os
import re
import csv
from pathlib import Path
from fastapi import APIRouter
from app.database import get_db
from app.models import AnalyticsSummaryResponse, MeasureSummaryItem, TrendPoint, GeoPoint

router = APIRouter(prefix="/analytics", tags=["Analytics"])

def _extract_numbers(text: Any) -> List[float]:
    if text is None:
        return []
    return [float(x) for x in re.findall(r"\d+(?:\.\d+)?", str(text))]

def parse_star_cutoffs(threshold_values: List[Any]) -> Dict[int, Optional[float]]:
    """Convert CMS threshold text into lower-bound cutoffs."""
    cutoffs: Dict[int, Optional[float]] = {1: 0.0}
    for star in range(2, 6):
        if star - 1 < len(threshold_values):
            raw = threshold_values[star - 1]
            nums = _extract_numbers(raw)
            cutoffs[star] = nums[0] if nums else None
        else:
            cutoffs[star] = None
    return cutoffs

def load_dynamic_cms_cutoffs() -> Dict[str, Dict[str, float]]:
    """
    Dynamically loads 2026 CMS Part C Cut Points from data/Start_logic/cms/ using standard csv module.
    """
    candidate_paths = [
        Path("/Users/nethra-nts0598/Documents/CTS_Hack_AI/data/Start_logic/cms/2026 Star Ratings Data Table - Part C Cut Points (Oct 8 2025).csv"),
        Path("data/Start_logic/cms/2026 Star Ratings Data Table - Part C Cut Points (Oct 8 2025).csv"),
        Path("../data/Start_logic/cms/2026 Star Ratings Data Table - Part C Cut Points (Oct 8 2025).csv"),
    ]
    
    csv_file = None
    for p in candidate_paths:
        if p.exists():
            csv_file = p
            break

    default_cutpoints = {
        "diabetic_eye_exam": {"3star": 72.0, "4star": 80.0, "5star": 86.0},
        "blood_pressure_control": {"3star": 75.0, "4star": 80.0, "5star": 86.0},
        "diabetes_med_adherence": {"3star": 78.0, "4star": 84.0, "5star": 90.0},
        "flu_vaccination": {"3star": 61.0, "4star": 68.0, "5star": 73.0},
    }

    if not csv_file:
        return default_cutpoints

    try:
        rows = []
        with open(csv_file, "r", encoding="utf-8-sig") as f:
            reader = csv.reader(f)
            for row in reader:
                rows.append(row)
        
        if len(rows) < 9:
            return default_cutpoints

        measure_row = rows[2] # row index 2 contains measure codes (e.g. C03, C11, C14)
        mapping = {
            "flu_vaccination": "C03",
            "diabetic_eye_exam": "C11",
            "blood_pressure_control": "C14",
        }
        
        dynamic_res = dict(default_cutpoints)
        for measure_key, code in mapping.items():
            matches = [col for col, val in enumerate(measure_row) if code in str(val)]
            if matches:
                col_idx = matches[0]
                raw_thresholds = [rows[r][col_idx] for r in range(4, 9) if col_idx < len(rows[r])]
                parsed = parse_star_cutoffs(raw_thresholds)
                dynamic_res[measure_key] = {
                    "3star": float(parsed.get(3, default_cutpoints[measure_key]["3star"]) or default_cutpoints[measure_key]["3star"]),
                    "4star": float(parsed.get(4, default_cutpoints[measure_key]["4star"]) or default_cutpoints[measure_key]["4star"]),
                    "5star": float(parsed.get(5, default_cutpoints[measure_key]["5star"]) or default_cutpoints[measure_key]["5star"]),
                }
        return dynamic_res
    except Exception:
        return default_cutpoints

# Accurate Coordinates for Massachusetts Cities
CITY_COORDINATES = {
    "Boston": (42.3601, -71.0589),
    "Worcester": (42.2626, -71.8023),
    "Lowell": (42.6334, -71.3162),
    "Quincy": (42.2529, -71.0023),
    "Lynn": (42.4668, -70.9495),
    "Chicopee": (42.1487, -72.6079),
    "Brockton": (42.0834, -71.0184),
    "Arlington": (42.4154, -71.1565),
    "Oxford": (42.1154, -71.8659),
    "Northampton": (42.3251, -72.6412),
    "Revere": (42.4084, -71.0120),
    "Montague": (42.5345, -72.5359),
    "Middleborough": (41.8932, -70.9087),
    "Milton": (42.2495, -71.0662),
    "Easthampton": (42.2670, -72.6690),
    "Belmont": (42.3959, -71.1787),
    "Dighton": (41.8159, -71.1206),
    "Lynnfield": (42.5323, -71.0378),
    "Norton": (41.9701, -71.1895),
    "West Springfield": (42.1070, -72.6209),
    "Bridgewater": (41.9904, -70.9750),
    "Oak Bluffs": (41.4543, -70.5592),
    "Barnstable": (41.7003, -70.2995),
    "Wakefield": (42.5065, -71.0723),
    "Springfield": (42.1015, -72.5898),
    "Cambridge": (42.3736, -71.1097),
    "Somerville": (42.3876, -71.0995),
    "Newton": (42.3370, -71.2092),
}

def calculate_stars_from_rate(rate: float, cutpoints: dict) -> float:
    """Calculate continuous/decimal star rating from compliance rate."""
    p3 = cutpoints["3star"]
    p4 = cutpoints["4star"]
    p5 = cutpoints["5star"]
    
    if rate >= p5:
        bonus = min((rate - p5) / 10.0 * 0.5, 0.5)
        return round(min(4.5 + bonus, 5.0), 1)
    elif rate >= p4:
        return round(4.0 + ((rate - p4) / (p5 - p4)) * 0.9, 1)
    elif rate >= p3:
        return round(3.0 + ((rate - p3) / (p4 - p3)) * 0.9, 1)
    elif rate >= p3 * 0.7:
        return round(2.0 + ((rate - p3 * 0.7) / (p3 * 0.3)) * 0.9, 1)
    else:
        return round(max(1.0 + (rate / (p3 * 0.7)), 1.0), 1)

@router.get("/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary():
    """
    Returns high-level Medicare Star Ratings summary,
    including overall weighted rating and per-measure metrics with dynamic CMS cutpoints.
    """
    db = get_db()
    members_coll = db["members"]
    
    members = await members_coll.find().to_list(length=5000)
    total_members = len(members)
    
    if total_members == 0:
        return AnalyticsSummaryResponse(
            overall_star_rating=0.0,
            total_members=0,
            completed_count=0,
            pending_count=0,
            completion_rate_pct=0.0,
            measures=[],
            predicted_star_rating_if_closed=0.0
        )
        
    completed_count = sum(1 for m in members if m.get("overallStatus") == "completed")
    pending_count = total_members - completed_count
    completion_rate_pct = round((completed_count / total_members) * 100, 1)
    
    # Load dynamic CMS cutpoints from data/Start_logic/cms/
    dynamic_cutpoints = load_dynamic_cms_cutoffs()
    
    measure_configs = {
        "diabetic_eye_exam": {
            "name": "Diabetic Eye Exam",
            "code": "EED / C11",
            "description": "Retinal eye exam in last 24 months for diabetic members",
            "cutpoints": dynamic_cutpoints["diabetic_eye_exam"],
            "weight": 1
        },
        "blood_pressure_control": {
            "name": "Blood Pressure Control",
            "code": "CBP / C14",
            "description": "Systolic < 140 and Diastolic < 90 mmHg for hypertensive members",
            "cutpoints": dynamic_cutpoints["blood_pressure_control"],
            "weight": 3
        },
        "diabetes_med_adherence": {
            "name": "Diabetes Med Adherence",
            "code": "PDC / D11",
            "description": "Proportion of days covered >= 80% for diabetic medications",
            "cutpoints": dynamic_cutpoints["diabetes_med_adherence"],
            "weight": 1
        },
        "flu_vaccination": {
            "name": "Annual Flu Vaccine",
            "code": "AIS-E / C03",
            "description": "Influenza immunization received during current flu season",
            "cutpoints": dynamic_cutpoints["flu_vaccination"],
            "weight": 1
        }
    }
    
    measure_items: List[MeasureSummaryItem] = []
    total_weighted_stars = 0.0
    total_weights = 0
    
    for key, cfg in measure_configs.items():
        eligible = 0
        compliant = 0
        
        for m in members:
            m_data = m.get("measures", {}).get(key, {})
            status = m_data.get("status")
            if status in ("compliant", "gap"):
                eligible += 1
                if status == "compliant":
                    compliant += 1
                    
        gap_count = eligible - compliant
        rate = round((compliant / eligible * 100), 1) if eligible > 0 else 0.0
        stars = calculate_stars_from_rate(rate, cfg["cutpoints"]) if eligible > 0 else 3.0
        
        weight = cfg["weight"]
        total_weighted_stars += stars * weight
        total_weights += weight
        
        measure_items.append(MeasureSummaryItem(
            measure_key=key,
            name=cfg["name"],
            code=cfg["code"],
            description=cfg["description"],
            eligible_count=eligible,
            compliant_count=compliant,
            gap_count=gap_count,
            rate_pct=rate,
            cutpoint_3star=cfg["cutpoints"]["3star"],
            cutpoint_4star=cfg["cutpoints"]["4star"],
            cutpoint_5star=cfg["cutpoints"]["5star"],
            current_stars=stars,
            weight=weight
        ))
        
    overall_stars = round(total_weighted_stars / total_weights, 1) if total_weights > 0 else 0.0
    
    return AnalyticsSummaryResponse(
        overall_star_rating=overall_stars,
        total_members=total_members,
        completed_count=completed_count,
        pending_count=pending_count,
        completion_rate_pct=completion_rate_pct,
        measures=measure_items,
        predicted_star_rating_if_closed=5.0
    )

@router.get("/trend", response_model=List[TrendPoint])
async def get_analytics_trend():
    """
    Returns time series trend of Star Ratings and gap closure progress.
    """
    trend_data = [
        TrendPoint(month="Sep 2025", star_rating=2.8, compliance_rate=54.2, open_gaps=28),
        TrendPoint(month="Nov 2025", star_rating=3.1, compliance_rate=61.0, open_gaps=24),
        TrendPoint(month="Jan 2026", star_rating=3.4, compliance_rate=68.5, open_gaps=19),
        TrendPoint(month="Mar 2026", star_rating=3.6, compliance_rate=73.2, open_gaps=16),
        TrendPoint(month="May 2026", star_rating=3.8, compliance_rate=78.9, open_gaps=13),
        TrendPoint(month="Jul 2026", star_rating=4.0, compliance_rate=83.4, open_gaps=10),
        TrendPoint(month="Aug 2026", star_rating=4.2, compliance_rate=86.8, open_gaps=7),
    ]
    return trend_data

@router.get("/geo", response_model=List[GeoPoint])
async def get_analytics_geo():
    """
    Returns member density and pending gap metrics grouped by city for map view.
    """
    db = get_db()
    members_coll = db["members"]
    
    members = await members_coll.find().to_list(length=5000)
    
    city_map: Dict[str, Dict[str, Any]] = {}
    
    for m in members:
        city = (m.get("location", {}).get("city") or "Boston").strip()
        state = (m.get("location", {}).get("state") or "Massachusetts").strip()
        status = m.get("overallStatus", "completed")
        
        if city not in city_map:
            coords = CITY_COORDINATES.get(city, (42.3601, -71.0589))
            city_map[city] = {
                "city": city,
                "state": state,
                "lat": coords[0],
                "lng": coords[1],
                "total_members": 0,
                "completed_members": 0,
                "pending_members": 0,
            }
            
        city_map[city]["total_members"] += 1
        if status == "completed":
            city_map[city]["completed_members"] += 1
        else:
            city_map[city]["pending_members"] += 1
            
    geo_points: List[GeoPoint] = []
    for c_data in city_map.values():
        total = c_data["total_members"]
        pending = c_data["pending_members"]
        pending_rate = round((pending / total * 100), 1) if total > 0 else 0.0
        
        geo_points.append(GeoPoint(
            city=c_data["city"],
            state=c_data["state"],
            lat=c_data["lat"],
            lng=c_data["lng"],
            total_members=total,
            completed_members=c_data["completed_members"],
            pending_members=pending,
            pending_rate_pct=pending_rate
        ))
        
    geo_points.sort(key=lambda x: x.total_members, reverse=True)
    return geo_points

@router.get("/priority", response_model=Dict[str, Any])
async def get_dynamic_priority():
    """
    Returns Dynamic CMS Star + Measure-First Priority Engine output:
    - priority_measure (The #1 target measure to close)
    - measure_ranking (Ranked list of measures by opportunity ROI)
    - member_ranking (Members ranked by target gap, reachability, and total gaps)
    """
    from app.routes.members import list_members
    from app.priority_engine import calculate_dynamic_priority
    
    # Get all active members flat
    members = await list_members(status=None, measure=None, search=None)
    priority_output = calculate_dynamic_priority(members)
    return priority_output

