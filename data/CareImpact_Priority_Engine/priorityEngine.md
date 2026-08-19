# CareImpact Priority Engine

## Two-step logic

### Step 1 — Number of gaps

```text
Number of Gaps = Eligible Members - Compliant Members
```

This tells us the size of the improvement opportunity.

### Step 2 — Next-Star reachability

1. Calculate current performance:

```text
Pm = (Cm / Em) × 100
```

2. Find the next Star cutpoint.

3. Calculate the performance distance:

```text
Distance = Next Star Cutpoint - Pm
```

4. Convert the percentage distance into members that need to become
compliant:

```text
Gaps Needed = ceil((Distance / 100) × Eligible Members)
```

5. Calculate reachability:

```text
Reachability =
(1 - Gaps Needed / Number of Gaps) × 100
```

A higher value means the next Star is easier to reach using the
currently available gap population.

## Portfolio priority score

For ranking multiple measures, the engine normalizes the number of
gaps against the largest gap count in the portfolio:

```text
Gap Opportunity = Number of Gaps / Maximum Number of Gaps
```

Then:

```text
Priority Score =
    (Gap Opportunity × 50)
    +
    (Reachability × 50)
```

Therefore:

- More gaps = larger improvement opportunity.
- Higher next-Star reachability = more achievable improvement.
- High opportunity + high reachability = high priority.

## Important

This is the CareImpact prototype logic discussed for the project.
It is not an official CMS Star Ratings formula. Actual CMS
methodology should be applied when implementing production calculations.
