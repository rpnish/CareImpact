"""
CareImpact Formula Engine
-------------------------
Prototype implementation of the formulas shown in the CareImpact
"Formula & Decision Logic" slides.

IMPORTANT:
This is a prototype mathematical engine based on the formulas supplied
for the project. It is NOT an official CMS Star Ratings implementation.
CMS methodologies can contain measure-specific rules, weighting,
case-mix adjustments, data validation, guardrails, and other rules that
are not represented here.

Formula flow:
Member Data -> Pm -> Dm -> Qm -> Gm -> Pm' -> Star_m'

Where:
Pm  = (Cm / Em) * 100
Dm  = Snext - Pm
Qm  = Wm * (1 - Dm / S) * 50 + Rm
Pm' = ((Cm + Gm) / Em) * 100
Star_m' = f(Pm', CMS cutpoints)
"""

from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class MeasureInput:
    measure_id: str
    compliant_members: int          # Cm
    eligible_members: int           # Em
    weight: float                   # Wm
    reachability_score: float       # Rm
    cutpoint_spread: float          # S
    star_cutpoints: Dict[int, float]  # e.g. {1: 0, 2: 50, 3: 70, 4: 80, 5: 90}


@dataclass
class MeasureResult:
    measure_id: str
    performance_pct: float          # Pm
    current_star: int
    next_star: Optional[int]
    next_cutpoint: Optional[float]
    distance_to_next_star: float    # Dm
    priority_score: float            # Qm
    projected_performance_pct: Optional[float] = None
    projected_star: Optional[int] = None
    gaps_closed: Optional[int] = None


def validate_input(m: MeasureInput) -> None:
    if m.eligible_members <= 0:
        raise ValueError("Eligible members (Em) must be greater than 0.")

    if not 0 <= m.compliant_members <= m.eligible_members:
        raise ValueError("Compliant members (Cm) must be between 0 and Em.")

    if m.weight < 0:
        raise ValueError("Measure weight (Wm) cannot be negative.")

    if m.reachability_score < 0:
        raise ValueError("Reachability score (Rm) cannot be negative.")

    if m.cutpoint_spread <= 0:
        raise ValueError("Cutpoint spread (S) must be greater than 0.")

    if not m.star_cutpoints:
        raise ValueError("At least one Star Rating cutpoint is required.")

    for star, cutoff in m.star_cutpoints.items():
        if star < 1:
            raise ValueError("Star levels must be >= 1.")
        if cutoff < 0 or cutoff > 100:
            raise ValueError("Star cutpoints must be between 0 and 100.")


def calculate_measure_performance(cm: int, em: int) -> float:
    """Pm = (Cm / Em) * 100"""
    if em <= 0:
        raise ValueError("Eligible members (Em) must be greater than 0.")
    return (cm / em) * 100.0


def determine_star(performance_pct: float,
                   cutpoints: Dict[int, float]) -> int:
    """
    Assign the highest star whose cutpoint is <= performance.

    Example:
        cutpoints = {1: 0, 2: 50, 3: 70, 4: 80, 5: 90}
        performance = 83 -> 4 stars
        performance = 92 -> 5 stars
    """
    ordered = sorted(cutpoints.items(), key=lambda x: x[1])

    eligible_stars = [star for star, cutoff in ordered
                      if performance_pct >= cutoff]

    if not eligible_stars:
        return min(cutpoints.keys())

    return max(eligible_stars)


def find_next_star(performance_pct: float,
                   cutpoints: Dict[int, float]):
    """Return the next star level and its cutpoint above current performance."""
    higher = [
        (star, cutoff)
        for star, cutoff in cutpoints.items()
        if cutoff > performance_pct
    ]

    if not higher:
        return None, None

    star, cutoff = min(higher, key=lambda x: x[1])
    return star, cutoff


def calculate_distance_to_next_star(performance_pct: float,
                                    cutpoints: Dict[int, float]) -> float:
    """
    Dm = Snext - Pm

    If the measure is already at the highest available cutpoint,
    Dm is returned as 0 because there is no higher target.
    """
    _, next_cutpoint = find_next_star(performance_pct, cutpoints)

    if next_cutpoint is None:
        return 0.0

    return max(0.0, next_cutpoint - performance_pct)


def calculate_priority_score(weight: float,
                             distance_to_next_star: float,
                             cutpoint_spread: float,
                             reachability_score: float) -> float:
    """
    Qm = Wm * (1 - Dm/S) * 50 + Rm
    """
    normalized_gap = distance_to_next_star / cutpoint_spread
    return weight * (1.0 - normalized_gap) * 50.0 + reachability_score


def calculate_projected_performance(cm: int,
                                    gm: int,
                                    em: int) -> float:
    """
    Pm' = ((Cm + Gm) / Em) * 100

    Gm is capped so projected compliant members cannot exceed Em.
    """
    if gm < 0:
        raise ValueError("Gaps closed (Gm) cannot be negative.")

    projected_compliant = min(cm + gm, em)
    return (projected_compliant / em) * 100.0


def calculate_measure(m: MeasureInput,
                      gaps_closed: Optional[int] = None) -> MeasureResult:
    """Run the full formula chain for one measure."""
    validate_input(m)

    pm = calculate_measure_performance(
        m.compliant_members,
        m.eligible_members
    )

    current_star = determine_star(pm, m.star_cutpoints)
    next_star, next_cutpoint = find_next_star(pm, m.star_cutpoints)

    dm = 0.0 if next_cutpoint is None else max(0.0, next_cutpoint - pm)

    qm = calculate_priority_score(
        m.weight,
        dm,
        m.cutpoint_spread,
        m.reachability_score
    )

    result = MeasureResult(
        measure_id=m.measure_id,
        performance_pct=pm,
        current_star=current_star,
        next_star=next_star,
        next_cutpoint=next_cutpoint,
        distance_to_next_star=dm,
        priority_score=qm,
    )

    if gaps_closed is not None:
        pm_projected = calculate_projected_performance(
            m.compliant_members,
            gaps_closed,
            m.eligible_members
        )

        projected_star = determine_star(
            pm_projected,
            m.star_cutpoints
        )

        result.projected_performance_pct = pm_projected
        result.projected_star = projected_star
        result.gaps_closed = gaps_closed

    return result


def calculate_portfolio(measures: List[MeasureInput],
                        gaps_closed_by_measure: Optional[Dict[str, int]] = None
                        ) -> List[MeasureResult]:
    """
    Run the engine for multiple measures and rank them by priority score.

    Higher Qm = higher priority in this prototype.
    """
    gaps_closed_by_measure = gaps_closed_by_measure or {}

    results = [
        calculate_measure(
            measure,
            gaps_closed=gaps_closed_by_measure.get(measure.measure_id)
        )
        for measure in measures
    ]

    return sorted(results, key=lambda r: r.priority_score, reverse=True)


def result_to_dict(result: MeasureResult) -> dict:
    return {
        "measure_id": result.measure_id,
        "measure_performance_pct": round(result.performance_pct, 4),
        "current_star": result.current_star,
        "next_star": result.next_star,
        "next_cutpoint": (
            None if result.next_cutpoint is None
            else round(result.next_cutpoint, 4)
        ),
        "distance_to_next_star": round(result.distance_to_next_star, 4),
        "priority_score": round(result.priority_score, 4),
        "gaps_closed": result.gaps_closed,
        "projected_performance_pct": (
            None if result.projected_performance_pct is None
            else round(result.projected_performance_pct, 4)
        ),
        "projected_star": result.projected_star,
    }


if __name__ == "__main__":
    # Small demo using fictional numbers.
    # Replace these with your actual measure/member data and CMS cutpoints.
    demo = MeasureInput(
        measure_id="MEASURE_001",
        compliant_members=820,       # Cm
        eligible_members=1000,       # Em
        weight=1.0,                  # Wm
        reachability_score=8.0,      # Rm
        cutpoint_spread=10.0,        # S
        star_cutpoints={
            1: 0.0,
            2: 50.0,
            3: 70.0,
            4: 80.0,
            5: 90.0,
        },
    )

    result = calculate_measure(demo, gaps_closed=50)

    print("CareImpact Formula Engine Demo")
    print("--------------------------------")
    for key, value in result_to_dict(result).items():
        print(f"{key}: {value}")
