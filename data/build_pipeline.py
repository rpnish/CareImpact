"""
UC04 - Star Ratings Gap-Closure Simulator
============================================
Combines raw Synthea CSV exports into ONE flat, database-ready CSV
of Medicare member measure records (gap-finder + star measure engine).

USAGE:
    python3 build_pipeline.py <input_folder> <output_folder>

INPUT:
    A folder containing the raw Synthea CSV export files (patients.csv,
    conditions.csv, procedures.csv, observations.csv, medications.csv,
    immunizations.csv, payer_transitions.csv, payers.csv). Filenames just
    need to CONTAIN these keywords - exact prefixes don't matter.

OUTPUT:
    combined_member_measures.csv   <- the single flat file for DB import
    data_model.md                  <- schema documentation
"""

import pandas as pd
import glob
import os
import sys
import re
from datetime import datetime, timezone

# ------------------------------------------------------------------
# CONFIG - adjust these if your "current date" / measurement window changes
# ------------------------------------------------------------------
TODAY = datetime(2026, 8, 14, tzinfo=timezone.utc)
LOOKBACK_START = datetime(2025, 8, 14, tzinfo=timezone.utc)  # rolling 12-month measurement year
MEDICARE_PAYER_NAME = "Medicare"  # matched against payers.csv NAME column


def find_file(folder, keyword):
    """Find a CSV file in folder whose name contains the given keyword."""
    matches = glob.glob(os.path.join(folder, f"*{keyword}*.csv"))
    if not matches:
        raise FileNotFoundError(f"No file matching '*{keyword}*.csv' found in {folder}")
    return matches[0]


def load_all(folder):
    files = {
        'patients': find_file(folder, 'patient'),
        'conditions': find_file(folder, 'condition'),
        'procedures': find_file(folder, 'procedure'),
        'observations': find_file(folder, 'observ'),
        'medications': find_file(folder, 'medication'),
        'immunizations': find_file(folder, 'immuniz'),
        'payer_transitions': find_file(folder, 'payer_transition'),
        'payers': find_file(folder, 'payers'),
    }
    data = {k: pd.read_csv(v) for k, v in files.items()}

    # normalize datetime columns (utc, coerce errors)
    data['procedures']['START'] = pd.to_datetime(data['procedures']['START'], errors='coerce', utc=True)
    data['observations']['DATE'] = pd.to_datetime(data['observations']['DATE'], errors='coerce', utc=True)
    data['medications']['START'] = pd.to_datetime(data['medications']['START'], errors='coerce', utc=True)
    data['immunizations']['DATE'] = pd.to_datetime(data['immunizations']['DATE'], errors='coerce', utc=True)
    data['conditions']['START'] = pd.to_datetime(data['conditions']['START'], errors='coerce', utc=True)
    data['patients']['BIRTHDATE'] = pd.to_datetime(data['patients']['BIRTHDATE'], errors='coerce')

    return data


def clean_name(name):
    """Strip Synthea's trailing numeric suffixes from names, e.g. 'John123' -> 'John'."""
    return re.sub(r'\d+', '', str(name)).strip()


def build_measures(data):
    patients = data['patients']
    conditions = data['conditions']
    procedures = data['procedures']
    observations = data['observations']
    medications = data['medications']
    immunizations = data['immunizations']
    pt = data['payer_transitions']
    payers = data['payers']

    patients['age'] = ((TODAY.replace(tzinfo=None) - patients['BIRTHDATE']).dt.days // 365)

    medicare_row = payers[payers['NAME'].str.strip().str.lower() == MEDICARE_PAYER_NAME.lower()]
    if medicare_row.empty:
        raise ValueError(f"No payer named '{MEDICARE_PAYER_NAME}' found in payers.csv")
    medicare_id = medicare_row.iloc[0]['Id']

    medicare_patients = set(pt[pt['PAYER'] == medicare_id]['PATIENT'].unique())
    cohort = patients[patients['Id'].isin(medicare_patients)].copy()

    # ---- condition flags ----
    diab_mask = conditions['DESCRIPTION'].str.contains('diabetes mellitus type 2', case=False, na=False)
    diabetics = set(conditions[diab_mask]['PATIENT']) & medicare_patients

    hyper_mask = conditions['DESCRIPTION'].str.contains('Essential hypertension', case=False, na=False)
    hypertensives = set(conditions[hyper_mask]['PATIENT']) & medicare_patients

    # ---- measure helper closures ----
    # EED real rule (NCQA HEDIS): compliant if exam in the 12-month measurement
    # window, OR a NEGATIVE exam (no retinopathy) in the prior year (up to 24mo back).
    # Our data does not encode exam result (positive/negative retinopathy), so as a
    # documented simplification we treat ANY exam within the last 24 months as
    # compliant. See RULES_AND_SOURCES.md for the exact quoted specification.
    EYE_EXAM_LOOKBACK = LOOKBACK_START - pd.Timedelta(days=365)  # 24 months back total

    eye_mask = procedures['DESCRIPTION'].str.contains('Diabetic retinal eye exam', case=False, na=False)
    eye_recent = procedures[eye_mask & (procedures['START'] >= EYE_EXAM_LOOKBACK)]
    eye_compliant = set(eye_recent['PATIENT'].unique())

    # AIS-E / flu real rule (NCQA HEDIS): compliant if vaccinated between July 1 of
    # the year prior to the measurement year and the end of the measurement year
    # (a ~18-month flu-season-aligned window, not a flat rolling 12 months).
    FLU_LOOKBACK = datetime(LOOKBACK_START.year - 1 if LOOKBACK_START.month < 7 else LOOKBACK_START.year,
                             7, 1, tzinfo=timezone.utc)

    flu_mask = immunizations['DESCRIPTION'].str.contains('influenza', case=False, na=False)
    flu_recent = immunizations[flu_mask & (immunizations['DATE'] >= FLU_LOOKBACK)]
    flu_compliant = set(flu_recent['PATIENT'].unique())

    def eye_status(pid):
        if pid not in diabetics:
            return None
        last_exam = procedures[(procedures['PATIENT'] == pid) & eye_mask]['START'].max()
        return {
            'eligible': True,
            'compliant': pid in eye_compliant,
            'value': last_exam.strftime('%Y-%m-%d') if pd.notna(last_exam) else None,
            'value_label': 'last_exam_date',
        }

    def bp_status(pid):
        if pid not in hypertensives:
            return None
        obs_p = observations[(observations['PATIENT'] == pid) & (observations['DATE'] >= LOOKBACK_START)]
        sys_r = obs_p[obs_p['DESCRIPTION'] == 'Systolic Blood Pressure'].sort_values('DATE')
        dia_r = obs_p[obs_p['DESCRIPTION'] == 'Diastolic Blood Pressure'].sort_values('DATE')
        if sys_r.empty or dia_r.empty:
            return {'eligible': True, 'compliant': False, 'value': None, 'value_label': 'last_bp'}
        sv, dv = float(sys_r.iloc[-1]['VALUE']), float(dia_r.iloc[-1]['VALUE'])
        return {
            'eligible': True,
            'compliant': sv < 140 and dv < 90,
            'value': f"{sv:.0f}/{dv:.0f}",
            'value_label': 'last_bp_reading'
        }

    def adherence_status(pid):
        if pid not in diabetics:
            return None
        meds_p = medications[(medications['PATIENT'] == pid) &
                              medications['DESCRIPTION'].str.contains('Metformin', case=False, na=False)]
        if meds_p.empty:
            return {'eligible': False, 'compliant': None, 'value': None, 'value_label': 'adherence_pct'}
        total_dispenses = meds_p['DISPENSES'].fillna(1).sum()
        days_supplied = total_dispenses * 30
        window_days = (TODAY - LOOKBACK_START).days
        pdc = min(days_supplied / window_days, 1.0)
        return {
            'eligible': True,
            'compliant': pdc >= 0.80,
            'value': f"{round(pdc*100,1)}",
            'value_label': 'adherence_pct'
        }

    def flu_status(pid):
        last_flu = immunizations[(immunizations['PATIENT'] == pid) & flu_mask]['DATE'].max()
        return {
            'eligible': True,
            'compliant': pid in flu_compliant,
            'value': last_flu.strftime('%Y-%m-%d') if pd.notna(last_flu) else None,
            'value_label': 'last_flu_shot_date'
        }

    MEASURE_FUNCS = {
        'diabetic_eye_exam': eye_status,
        'blood_pressure_control': bp_status,
        'diabetes_med_adherence': adherence_status,
        'flu_vaccination': flu_status,
    }

    # ---- flatten into one row per member-measure ----
    rows = []
    for _, row in cohort.iterrows():
        pid = row['Id']
        base = {
            'member_id': pid,
            'member_name': clean_name(f"{row['FIRST']} {row['LAST']}"),
            'age': int(row['age']) if pd.notna(row['age']) else None,
            'gender': row['GENDER'],
            'city': row['CITY'],
            'state': row['STATE'],
            'has_diabetes': pid in diabetics,
            'has_hypertension': pid in hypertensives,
            'insurance_company': MEDICARE_PAYER_NAME,
        }
        for measure_key, func in MEASURE_FUNCS.items():
            result = func(pid)
            r = dict(base)
            r['measure'] = measure_key
            if result is None:
                r.update({'eligible': False, 'compliant': None, 'gap_open': False,
                           'value_label': None, 'value': None})
            else:
                eligible = result['eligible']
                compliant = result.get('compliant')
                r.update({
                    'eligible': eligible,
                    'compliant': compliant,
                    'gap_open': bool(eligible and compliant is False),
                    'value_label': result.get('value_label'),
                    'value': result.get('value'),
                })
            rows.append(r)

    combined = pd.DataFrame(rows)
    col_order = ['member_id', 'member_name', 'age', 'gender', 'city', 'state',
                 'insurance_company', 'has_diabetes', 'has_hypertension',
                 'measure', 'eligible', 'compliant', 'gap_open', 'value_label', 'value']
    combined = combined[col_order]
    return combined


def measure_summary(combined):
    summary = []
    for measure, grp in combined.groupby('measure'):
        elig = grp[grp['eligible'] == True]
        comp = elig[elig['compliant'] == True]
        rate = round(len(comp) / len(elig) * 100, 1) if len(elig) else 0.0
        summary.append({
            'measure': measure,
            'eligible_count': len(elig),
            'compliant_count': len(comp),
            'gap_count': len(elig) - len(comp),
            'rate_pct': rate
        })
    return pd.DataFrame(summary)


def write_data_model_doc(path):
    doc = """# Data Model — combined_member_measures.csv

One row = one (member, measure) pair. A member with 4 applicable measures
produces 4 rows.

| Column | Type | Description |
|---|---|---|
| member_id | string (UUID) | Unique patient identifier, from source patients.csv |
| member_name | string | Patient full name (cleaned of Synthea numeric suffixes) |
| age | integer | Patient age as of the report date |
| gender | string | M / F |
| city | string | Patient city |
| state | string | Patient state |
| insurance_company | string | Payer name (currently filtered to "Medicare" only) |
| has_diabetes | boolean | True if patient has a Type 2 diabetes diagnosis |
| has_hypertension | boolean | True if patient has an essential hypertension diagnosis |
| measure | string | One of: diabetic_eye_exam, blood_pressure_control, diabetes_med_adherence, flu_vaccination |
| eligible | boolean | Whether this member is in the denominator for this measure |
| compliant | boolean / null | Whether this member met the measure (null if not eligible) |
| gap_open | boolean | True if eligible AND not compliant — this is the actionable "care gap" flag |
| value_label | string | What kind of raw value is stored (e.g. last_exam_date, last_bp, pdc_pct, last_flu_date) |
| value | string | The raw supporting value/date for that measure |

## Measure definitions

- **diabetic_eye_exam**: Diabetic members who received a retinal eye exam procedure in the
  last 12 months (rolling window). Denominator = members with a Type 2 diabetes diagnosis.
- **blood_pressure_control**: Hypertensive members whose most recent BP reading in the
  last 12 months was below 140/90. Denominator = members with essential hypertension diagnosis.
- **diabetes_med_adherence**: Diabetic members on Metformin, using a simplified Proportion
  of Days Covered (PDC) proxy: (dispenses * 30 days) / measurement window days, capped at 100%.
  Compliant if PDC >= 80%. Denominator = diabetics who have at least one Metformin fill.
- **flu_vaccination**: All Medicare members who received an influenza immunization in the
  last 12 months. Denominator = all Medicare cohort members.

## Suggested DB schema (normalized, if you prefer relational tables over the flat CSV)

```sql
CREATE TABLE members (
    member_id     VARCHAR(64) PRIMARY KEY,
    member_name   VARCHAR(200),
    age           INT,
    gender        CHAR(1),
    city          VARCHAR(100),
    state         VARCHAR(50),
    insurance_company VARCHAR(100),
    has_diabetes  BOOLEAN,
    has_hypertension BOOLEAN
);

CREATE TABLE member_measures (
    id            SERIAL PRIMARY KEY,
    member_id     VARCHAR(64) REFERENCES members(member_id),
    measure       VARCHAR(50),
    eligible      BOOLEAN,
    compliant     BOOLEAN,
    gap_open      BOOLEAN,
    value_label   VARCHAR(50),
    value         VARCHAR(100)
);
```

The flat CSV (`combined_member_measures.csv`) is simply the join of these two tables —
use it directly if your database can bulk-import CSV, or split it back into the two
tables above using `member_id` as the join key if you prefer a normalized schema.

## Measurement window
Rolling 12-month lookback, currently configured as:
- Start: {start}
- End (report date): {end}

Adjust `TODAY` and `LOOKBACK_START` constants at the top of `build_pipeline.py` to change this.
""".format(start=LOOKBACK_START.date(), end=TODAY.date())
    with open(path, 'w') as f:
        f.write(doc)


def main():
    if len(sys.argv) != 3:
        print("Usage: python3 build_pipeline.py <input_folder> <output_folder>")
        sys.exit(1)

    input_folder, output_folder = sys.argv[1], sys.argv[2]
    os.makedirs(output_folder, exist_ok=True)

    print(f"Loading raw CSVs from {input_folder} ...")
    data = load_all(input_folder)

    print("Building Medicare cohort and computing measures ...")
    combined = build_measures(data)

    out_csv = os.path.join(output_folder, 'combined_member_measures.csv')
    combined.to_csv(out_csv, index=False)
    print(f"Wrote {out_csv}  ({len(combined)} rows)")

    doc_path = os.path.join(output_folder, 'data_model.md')
    write_data_model_doc(doc_path)
    print(f"Wrote {doc_path}")

    summary = measure_summary(combined)
    print("\n=== Measure summary ===")
    print(summary.to_string(index=False))

    summary_path = os.path.join(output_folder, 'measure_summary.csv')
    summary.to_csv(summary_path, index=False)
    print(f"\nWrote {summary_path}")


if __name__ == '__main__':
    main()
