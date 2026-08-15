# Measure Rules & Sources

This document explains exactly how each measure's `compliant` / `gap` /
`not_eligible` status is calculated, and links to the real published
specification each rule is based on. All rules come from **NCQA HEDIS**
technical specifications (the same specifications CMS uses to calculate
Medicare Part C & D Star Ratings) — nothing here was invented or guessed.

Measurement year used in this build: **August 14, 2025 → August 14, 2026**
(configurable via `TODAY` / `LOOKBACK_START` constants in `build_pipeline.py`).

---

## 1. Diabetic Eye Exam (HEDIS measure: EED — Eye Exam for Patients with Diabetes)

**Official rule:**
> Members 18–75 with diabetes (type 1 or 2) who had a retinal or dilated eye
> exam by an eye care professional during the measurement year, OR a negative
> retinal exam (no evidence of retinopathy) in the year prior to the
> measurement year.

Source: NCQA HEDIS MY2026 Technical Specifications, as summarized in:
https://www.bcbsnd.com/providers/programs/bluealliance-and-bluealliance-care-plus/hedis-tip-sheets/hedis-tip-sheet-search/eed

Additional detail on the annual-vs-biennial logic:
> A retinal or dilated eye exam must be performed by an eye care professional
> annually for patients with positive retinopathy, and every two years for
> patients without evidence of retinopathy.

Source: https://www.bcbsm.com/amslibs/content/dam/public/providers/documents/star-measure-tip-sheet-eye-exam-patients-diabetes.pdf

**What our data can and can't determine:**
Our source data (Synthea `procedures.csv`) records *that* an eye exam
happened and *when*, but does not record the clinical result (positive vs.
negative for retinopathy). Since we cannot distinguish high-risk from
low-risk patients, we apply a **documented simplification**: any diabetic
retinal eye exam procedure within the **last 24 months** counts as
compliant. This is a reasonable proxy for the real rule (which allows up to
24 months for low-risk patients) but will slightly over-count compliance for
members who actually have positive retinopathy and should be re-examined
annually.

**Implemented rule:** `last_exam_date >= (measurement_year_start - 12 months)`
i.e. a rolling 24-month window ending at the measurement year's end.

---

## 2. Blood Pressure Control (HEDIS measure: CBP — Controlling High Blood Pressure)

**Official rule:**
> The percentage of members ages 18–85 with a diagnosis of hypertension whose
> blood pressure was adequately controlled (<140/90 mmHg) during the
> measurement year. Adequate control = the most recent BP reading during the
> measurement year, both systolic <140 and diastolic <90. If no BP is
> recorded during the measurement year, assume the BP is "not controlled."

Source: https://www.hopkinsmedicine.org/johns-hopkins-health-plans/providers-physicians/health-care-performance-measures/hedis/controlling-high-bp

Confirmed again in the 2026 Star Ratings measure list:
https://www.cms.gov/files/document/2026-star-ratings-measures.pdf

**Implemented rule:** matches the official spec exactly — most recent BP
reading within the current 12-month measurement year; systolic < 140 AND
diastolic < 90 = compliant; no reading in the window = gap (not controlled).
No simplification was needed for this measure.

---

## 3. Diabetes Medication Adherence (Proportion of Days Covered — PDC proxy)

**Official concept:** Medicare Part D Star Ratings include medication
adherence measures based on **Proportion of Days Covered (PDC)** — the
percentage of days in the measurement period a patient had medication on
hand, based on pharmacy fill/refill dates. Compliant threshold is typically
**PDC ≥ 80%**.

Note: CMS's 2026 technical changes reduced the *weight* of medication
adherence measures in the overall Star calculation (from 3x to 1x), but the
80% PDC compliance threshold itself is unchanged. See:
https://www.cms.gov/files/document/2026-star-ratings-technical-notes.pdf

**What our data can and can't determine:**
True PDC requires day-by-day fill-gap tracking across the full measurement
year. Our source data (Synthea `medications.csv`) gives per-prescription
`DISPENSES` counts but not exact fill/refill calendar dates for each fill.
We use a **documented simplification**:

```
days_supplied = total_dispenses * 30   (assumes standard 30-day fills)
PDC proxy = min(days_supplied / measurement_window_days, 100%)
compliant if PDC proxy >= 80%
```

This approximates real PDC methodology but does not detect gaps *within*
the year (e.g., a member who filled enough total doses but had a 3-month
lapse mid-year would still show as compliant here).

---

## 4. Flu Vaccination (HEDIS measure: AIS-E — Adult Immunization Status)

**Official rule:**
> Members who received an influenza vaccine on or between July 1 of the year
> prior to the measurement period and the end of the measurement period.

Source: https://www.molinahealthcare.com/~/media/Molina/PublicWebsite/PDF/providers/ma/Quality/HEDIS%20Tip%20Sheet_AIS-E_Adult%20Immunization%20Status.pdf

Confirmed as a weighted Part C Star measure ("C03 - Annual Flu Vaccine") in:
https://www.cms.gov/files/document/2026-star-ratings-measures.pdf

**Implemented rule:** vaccination date falls between **July 1 of the year
before the measurement year** and the **end of the measurement year** — an
~18-month, flu-season-aligned window rather than a flat rolling 12 months.
This matches the official spec exactly.

---

## Summary of implementation vs. official spec

| Measure | Matches official spec? | Simplification applied |
|---|---|---|
| Diabetic eye exam | Close, not exact | Can't tell positive vs. negative retinopathy result from source data, so we use a flat 24-month lookback for all diabetics instead of 12mo (positive) / 24mo (negative) |
| Blood pressure control | Exact match | None needed |
| Diabetes medication adherence | Approximation | PDC estimated from total dispenses ÷ window days (30-day fill assumption), not true day-by-day fill-gap tracking |
| Flu vaccination | Exact match | None needed |

## Where to get the authoritative source

CMS publishes the full official Part C & D Star Ratings measure list,
technical notes, and cutpoint data tables here:
https://www.cms.gov/medicare/health-drug-plans/part-c-d-performance-data

The exact HEDIS measure specifications (owned by NCQA) are in:
*HEDIS Volume 2: Technical Specifications for Health Plans* — a licensed
NCQA publication (ncqa.org/publications). The tip sheets cited above are
health-plan-published summaries of those specifications, used here because
the full NCQA volume is not freely downloadable.
