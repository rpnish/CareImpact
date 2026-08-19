# CareImpact Formula Engine

This folder contains a Python prototype implementing the mathematical
flow shown in the CareImpact Formula & Decision Logic slides.

## Formula flow

`Member Data -> Pm -> Dm -> Qm -> Gm -> Pm' -> Star_m'`

### 1. Measure Performance

`Pm = (Cm / Em) * 100`

- `Cm` = compliant members
- `Em` = eligible members

### 2. Distance to Next Star

`Dm = Snext - Pm`

- `Snext` = next applicable Star cutpoint
- `Pm` = current measure performance

### 3. Quality Gap Priority Score

`Qm = Wm * (1 - Dm/S) * 50 + Rm`

- `Wm` = measure weight/importance
- `Dm` = distance to next Star
- `S` = cutpoint spread used for normalization
- `Rm` = reachability score

### 4. Gap-Closure Simulation

`Pm' = ((Cm + Gm) / Em) * 100`

- `Gm` = number of gaps hypothetically closed
- `Pm'` = projected performance

Then:

`Star_m' = f(Pm', CMS Cutpoints)`

The engine assigns the highest star whose cutpoint is less than or
equal to projected performance.

## Files

- `careimpact_engine.py` - reusable calculation engine
- `sample_input.json` - fictional example inputs
- `requirements.txt` - no third-party dependencies required

## Important prototype note

This code is a direct implementation of the formulas supplied for the
CareImpact prototype. It should not be represented as the official CMS
Star Ratings calculation. Actual CMS methodology can involve
measure-specific rules, weighting, cutpoint methodology, adjustments,
data validation, and other requirements.

## Running

Python 3.9+ is recommended.

```bash
python careimpact_engine.py
```

No external Python package is required.
