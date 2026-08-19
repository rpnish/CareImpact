"""
CareImpact Priority Engine
===========================

Two-step priority logic:

1. Number of gaps
   Gaps = Eligible Members - Compliant Members

2. Next-Star reachability
   - Find the next Star cutpoint.
   - Calculate the performance distance to that cutpoint.
   - Calculate how many additional compliant members are required.
   - Calculate reachability based on how much of the available gap
     population must be closed.

This is a prototype implementation of the CareImpact priority concept.
It is NOT an official CMS Star Ratings formula.
"""

from dataclasses import dataclass
from math import ceil
from typing import Dict, Optional


@dataclass
class PriorityResult:
    measure_id: str
    eligible_members: int
    compliant_members: int
    number_of_gaps: int
    current_performance_pct: float
    current_star: int
    next_star: Optional[int]
    next_star_cutpoint: Optional[float]
    performance_gap_to_next_star: float
    gaps_needed_for_next_star: int
    reachability_pct: float
    priority_score: float


def validate_inputs(
    eligible_members: int,
    compliant_members: int,
    cutpoints: Dict[int, float],
) -> None:
    if eligible_members <= 0:
        raise ValueError("Eligible members must be greater than 0.")

    if compliant_members < 0 or compliant_members > eligible_members:
        raise ValueError(
            "Compliant members must be between 0 and eligible members."
        )

    if not cutpoints:
        raise ValueError("Star cutpoints cannot be empty.")

    for star, cutoff in cutpoints.items():
        if star < 1:
            raise ValueError("Star rating must be >= 1.")
        if cutoff < 0 or cutoff > 100:
            raise ValueError("Star cutpoints must be between 0 and 100.")


def calculate_number_of_gaps(
    eligible_members: int,
    compliant_members: int,
) -> int:
    """
    STEP 1

    Number of gaps = Eligible Members - Compliant Members
    """
    return eligible_members - compliant_members


def calculate_performance(
    compliant_members: int,
    eligible_members: int,
) -> float:
    """Current measure performance percentage."""
    return (compliant_members / eligible_members) * 100.0


def determine_current_star(
    performance_pct: float,
    cutpoints: Dict[int, float],
) -> int:
    """
    Assign the highest Star level whose cutpoint is <= performance.
    """
    eligible_stars = [
        star
        for star, cutoff in cutpoints.items()
        if performance_pct >= cutoff
    ]

    if not eligible_stars:
        return min(cutpoints.keys())

    return max(eligible_stars)


def find_next_star(
    performance_pct: float,
    cutpoints: Dict[int, float],
):
    """
    Find the nearest Star cutpoint above current performance.
    """
    higher_cutpoints = [
        (star, cutoff)
        for star, cutoff in cutpoints.items()
        if cutoff > performance_pct
    ]

    if not higher_cutpoints:
        return None, None

    return min(higher_cutpoints, key=lambda x: x[1])


def calculate_next_star_reachability(
    eligible_members: int,
    compliant_members: int,
    performance_pct: float,
    cutpoints: Dict[int, float],
    number_of_gaps: int,
):
    """
    STEP 2

    1. Find next Star cutpoint.
    2. Calculate performance distance.
    3. Convert that percentage distance into required compliant members.
    4. Compare required members with available gaps.

    Reachability:
        R = (1 - gaps_needed / number_of_gaps) * 100

    A measure needing fewer available gaps to reach the next Star
    receives a higher reachability score.
    """

    next_star, next_cutpoint = find_next_star(
        performance_pct,
        cutpoints
    )

    # Already at the highest available Star.
    if next_star is None:
        return {
            "next_star": None,
            "next_star_cutpoint": None,
            "performance_gap_to_next_star": 0.0,
            "gaps_needed_for_next_star": 0,
            "reachability_pct": 100.0,
        }

    performance_gap = next_cutpoint - performance_pct

    # Number of additional compliant members required to cross
    # the next Star threshold.
    gaps_needed = ceil(
        (performance_gap / 100.0) * eligible_members
    )

    # If there are no available gaps, reachability is zero unless
    # the next Star is already reached.
    if number_of_gaps == 0:
        reachability = 0.0
    else:
        reachability = (
            1.0 - (gaps_needed / number_of_gaps)
        ) * 100.0

        # Keep the score within 0–100.
        reachability = max(0.0, min(100.0, reachability))

    return {
        "next_star": next_star,
        "next_star_cutpoint": next_cutpoint,
        "performance_gap_to_next_star": performance_gap,
        "gaps_needed_for_next_star": gaps_needed,
        "reachability_pct": reachability,
    }


def calculate_priority_score(
    number_of_gaps: int,
    reachability_pct: float,
) -> float:
    """
    Simple two-factor priority engine.

    Gap opportunity is normalized against the maximum gap count
    supplied to the engine, while reachability is already 0–100.

    Priority Score = 50 * Gap Opportunity + 50 * Reachability

    Both components are normalized to 0–1.

    This makes the engine suitable for ranking multiple measures.
    """
    # This function is used by calculate_priority_portfolio(), where
    # max_gaps is known. For a single measure, use calculate_priority_score
    # only after normalizing its gap count.
    raise NotImplementedError(
        "Use calculate_priority_portfolio() for ranking measures."
    )


def calculate_priority_portfolio(measures):
    """
    Calculate and rank multiple measures.

    Each measure must contain:
        measure_id
        eligible_members
        compliant_members
        cutpoints

    Priority logic:
        Gap Opportunity = number_of_gaps / maximum_number_of_gaps
        Reachability    = reachability_pct / 100

        Priority Score =
            (Gap Opportunity * 50) +
            (Reachability * 50)

    Higher score = higher priority.
    """

    # -------------------------
    # STEP 1: NUMBER OF GAPS
    # -------------------------
    prepared = []

    for measure in measures:
        validate_inputs(
            measure["eligible_members"],
            measure["compliant_members"],
            measure["cutpoints"],
        )

        gaps = calculate_number_of_gaps(
            measure["eligible_members"],
            measure["compliant_members"],
        )

        performance = calculate_performance(
            measure["compliant_members"],
            measure["eligible_members"],
        )

        current_star = determine_current_star(
            performance,
            measure["cutpoints"],
        )

        reachability_data = calculate_next_star_reachability(
            eligible_members=measure["eligible_members"],
            compliant_members=measure["compliant_members"],
            performance_pct=performance,
            cutpoints=measure["cutpoints"],
            number_of_gaps=gaps,
        )

        prepared.append({
            "measure": measure,
            "number_of_gaps": gaps,
            "performance": performance,
            "current_star": current_star,
            **reachability_data,
        })

    max_gaps = max(
        (item["number_of_gaps"] for item in prepared),
        default=0,
    )

    # -------------------------
    # STEP 2: REACHABILITY
    # -------------------------
    results = []

    for item in prepared:
        if max_gaps == 0:
            gap_opportunity = 0.0
        else:
            gap_opportunity = (
                item["number_of_gaps"] / max_gaps
            )

        reachability = item["reachability_pct"] / 100.0

        priority_score = (
            gap_opportunity * 50.0
            + reachability * 50.0
        )

        results.append(
            PriorityResult(
                measure_id=item["measure"]["measure_id"],
                eligible_members=item["measure"]["eligible_members"],
                compliant_members=item["measure"]["compliant_members"],
                number_of_gaps=item["number_of_gaps"],
                current_performance_pct=item["performance"],
                current_star=item["current_star"],
                next_star=item["next_star"],
                next_star_cutpoint=item["next_star_cutpoint"],
                performance_gap_to_next_star=item[
                    "performance_gap_to_next_star"
                ],
                gaps_needed_for_next_star=item[
                    "gaps_needed_for_next_star"
                ],
                reachability_pct=item["reachability_pct"],
                priority_score=priority_score,
            )
        )

    return sorted(
        results,
        key=lambda result: result.priority_score,
        reverse=True,
    )


if __name__ == "__main__":

    # Fictional example.
    # Replace these values with your actual measure data and
    # CMS cutpoints.

    measures = [
        {
            "measure_id": "MEASURE_A",
            "eligible_members": 1000,
            "compliant_members": 820,
            "cutpoints": {
                1: 0.0,
                2: 50.0,
                3: 70.0,
                4: 80.0,
                5: 90.0,
            },
        },
        {
            "measure_id": "MEASURE_B",
            "eligible_members": 800,
            "compliant_members": 600,
            "cutpoints": {
                1: 0.0,
                2: 50.0,
                3: 70.0,
                4: 80.0,
                5: 90.0,
            },
        },
    ]

    results = calculate_priority_portfolio(measures)

    print("CareImpact Priority Engine")
    print("===========================")
    print()

    for rank, result in enumerate(results, start=1):
        print(f"Rank #{rank}: {result.measure_id}")
        print(f"  Eligible members       : {result.eligible_members}")
        print(f"  Compliant members      : {result.compliant_members}")
        print(f"  Number of gaps         : {result.number_of_gaps}")
        print(
            f"  Current performance    : "
            f"{result.current_performance_pct:.2f}%"
        )
        print(f"  Current Star            : {result.current_star}")
        print(f"  Next Star               : {result.next_star}")
        print(
            f"  Next Star cutpoint     : "
            f"{result.next_star_cutpoint}"
        )
        print(
            f"  Performance gap        : "
            f"{result.performance_gap_to_next_star:.2f} points"
        )
        print(
            f"  Gaps needed             : "
            f"{result.gaps_needed_for_next_star}"
        )
        print(
            f"  Next-Star reachability : "
            f"{result.reachability_pct:.2f}%"
        )
        print(
            f"  Priority score          : "
            f"{result.priority_score:.2f}"
        )
        print()
