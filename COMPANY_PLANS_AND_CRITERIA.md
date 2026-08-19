# CareImpact — Insurance Companies, Plans & Clinical Criteria Specification

> **Document Version:** 2.0  
> **Standard:** NCQA HEDIS Measurement Year 2026 / CMS Medicare Advantage Star Ratings  
> **Source Dataset:** `data/newmembers.csv` (220 Enrolled Patient Records)

---

## 1. Executive Summary & Architectural Overview

In **CareImpact**, insurance companies operate on a **plan-specific clinical evaluation model**. Rather than subjecting every member to a generic, one-size-fits-all measure checklist, each insurance plan is configured with its own tailored **Plan Benefit Package (PBP)** containing **2 to 3 target disease criteria**.

### Key Structural Principles:
1. **Plan Specialization**: Each plan targets a specific patient population and clinical domain (e.g. *Dual Eligible* targets complex diabetic microvascular care, *Blue Cross Blue Shield* targets preventive oncology and wellness, *Anthem/Aetna* target post-discharge care transitions).
2. **Independent Star Ratings**: Because each company evaluates a completely distinct portfolio of disease measures (and uninsured patients are exempt), **there is no cumulative network-wide Star score**. Star performance and care gap rates are calculated **strictly per individual company and per plan**.
3. **Criteria Isolation**: If a measure is not part of a plan's assigned benefit package, it is marked **`N/A`** and excluded from both the denominator and numerator for members in that plan.

---

## 2. Master Company & Plan Portfolio Matrix

| Company / Plan Name | Ownership | Members | Assigned Clinical Measures | Focus Disease Domain | Members with Gaps | Plan Star % | Star Rating |
| :--- | :--- | :---: | :--- | :--- | :---: | :---: | :---: |
| **Medicare** | `GOVERNMENT` | 22 | `CBP`, `HBD_C7`, `FVA` | Senior Chronic Care & Immunization | 5 / 22 | **87.2%** | **4.5 ★** *(High)* |
| **Cigna Health** | `PRIVATE` | 22 | `AWV`, `FVA` | Preventive Health & Immunization | 6 / 22 | **84.1%** | **4.4 ★** *(High)* |
| **UnitedHealthcare** | `PRIVATE` | 22 | `HBD_C7`, `FVA`, `KED` | Diabetic Kidney & Glycemic Health | 5 / 22 | **81.8%** | **4.3 ★** *(High)* |
| **Aetna** | `PRIVATE` | 22 | `SPD`, `CBP`, `MRP` | Cardiovascular & Post-Discharge Transitions | 11 / 22 | **70.7%** | **3.8 ★** *(Moderate)* |
| **Medicaid** | `GOVERNMENT` | 22 | `CBP`, `BCS`, `AWV` | Hypertension & Women's Health | 10 / 22 | **55.2%** | **3.2 ★** *(Moderate)* |
| **Anthem** | `PRIVATE` | 22 | `MRP`, `CBP` | Post-Discharge Care & Hypertension | 14 / 22 | **51.4%** | **3.1 ★** *(Moderate)* |
| **Dual Eligible** | `GOVERNMENT` | 22 | `CBP`, `KED`, `EED` | Complex Chronic & Diabetic Microvascular | 13 / 22 | **51.2%** | **3.0 ★** *(Moderate)* |
| **Humana** | `PRIVATE` | 22 | `CBP`, `HBD_C7`, `SPD` | Cardiovascular & Diabetes Adherence | 4 / 22 | **44.4%** | **2.8 ★** *(At Risk)* |
| **Blue Cross Blue Shield** | `PRIVATE` | 22 | `BCS`, `AWV`, `FVA` | Preventive Oncology & Wellness | 13 / 22 | **39.0%** | **2.6 ★** *(At Risk)* |
| **NO_INSURANCE** | `UNINSURED` | 22 | *None (Exempt)* | Excluded from CMS Payer Quality Ratings | 0 / 22 | **N/A** | **1.0 ★** |

---

## 3. Comprehensive Company-by-Company Breakdown

```
                  ┌────────────────────────────────────────┐
                  │          INSURANCE COMPANY             │
                  └───────────────────┬────────────────────┘
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
            ┌─────────────────────────┐ ┌─────────────────────────┐
            │   Plan Variant A        │ │   Plan Variant B        │
            │   (2-3 Assigned Measures│ │   (2-3 Assigned Measures│
            └────────────┬────────────┘ └────────────┬────────────┘
                         ▼                         ▼
                  Enrolled Members          Enrolled Members
                  (22 Patients)             (22 Patients)
```

---

### 1. Medicare
- **Ownership:** `GOVERNMENT`
- **Enrolled Population:** 22 Members (17 Gap-Free, 5 With Care Gaps)
- **Star Compliance:** `87.2%` (34 Met / 39 Evaluated Criteria Instances) · **4.5 ★**
- **Clinical Focus:** Senior Chronic Disease Management & Preventive Immunization.
- **Assigned Measures:**
  1. **`CBP` (Controlling High Blood Pressure — 3x CMS Weight)**
     - *Eligibility:* Members aged 18–85 diagnosed with essential hypertension.
     - *Numerator Rule:* `MET` if most recent outpatient BP in measurement year is $< 140/90\text{ mmHg}$. `GAP` if $\ge 140$ systolic or $\ge 90$ diastolic.
     - *Why Gaps Occur:* Uncontrolled systolic/diastolic blood pressure or missed annual outpatient vitals check.
     - *Action Protocol:* Telehealth titration consultation, home BP monitor distribution.
  2. **`HBD_C7` (Hemoglobin A1c Control for Diabetics <9%)**
     - *Eligibility:* Members aged 18–75 diagnosed with Type 1 or Type 2 diabetes.
     - *Numerator Rule:* `MET` if most recent HbA1c is $< 9.0\%$. `GAP` if $\ge 9.0\%$ or lab is missing.
     - *Why Gaps Occur:* Glycemic non-control or failure to complete annual HbA1c blood draw.
     - *Action Protocol:* Order home blood collection kit; continuous glucose monitoring enrollment.
  3. **`FVA` (Adult Annual Flu Vaccine)**
     - *Eligibility:* All enrolled senior members.
     - *Numerator Rule:* `MET` if influenza vaccine documented between July 1 and June 30.
     - *Why Gaps Occur:* No immunization claim or registry record during the active flu season window.
     - *Action Protocol:* SMS pharmacy voucher for zero-copay retail flu immunization.

---

### 2. Humana
- **Ownership:** `PRIVATE`
- **Enrolled Population:** 22 Members (18 Gap-Free, 4 With Care Gaps)
- **Star Compliance:** `44.4%` (4 Met / 9 Evaluated Criteria Instances) · **2.8 ★**
- **Clinical Focus:** Cardiovascular Disease & Diabetic Medication Adherence.
- **Assigned Measures:**
  1. **`CBP` (Controlling High Blood Pressure — 3x CMS Weight)**
     - *Status in Plan:* 2 Met, 3 Gaps (5 Eligible members).
     - *Why Gaps Occur:* Elevated BP readings in chronic hypertensive cohort.
  2. **`HBD_C7` (Hemoglobin A1c Glycemic Control <9%)**
     - *Status in Plan:* 2 Met, 0 Gaps (2 Eligible members).
     - *Why Gaps Occur:* Patients maintain glycemic stability but require ongoing quarterly surveillance.
  3. **`SPD` (Statin Therapy for Patients with Diabetes)**
     - *Status in Plan:* 0 Met, 2 Gaps (2 Eligible members).
     - *Eligibility:* Diabetic patients aged 40–75.
     - *Numerator Rule:* `MET` if patient fills $\ge 1$ statin prescription with Proportion of Days Covered ($\text{PDC}) \ge 80\%$.
     - *Why Gaps Occur:* Statin medication non-adherence or intolerance resulting in abandoned refills.
     - *Action Protocol:* Clinical pharmacist consultation; switch to hydrophilic statin (e.g. rosuvastatin) with 90-day mail order.

---

### 3. Dual Eligible
- **Ownership:** `GOVERNMENT` (Medicare + Medicaid Beneficiaries)
- **Enrolled Population:** 22 Members (9 Gap-Free, 13 With Care Gaps)
- **Star Compliance:** `51.2%` (22 Met / 43 Evaluated Criteria Instances) · **3.0 ★**
- **Clinical Focus:** High-Complexity Chronic Disease & Diabetic Microvascular Protection.
- **Assigned Measures:**
  1. **`CBP` (Controlling High Blood Pressure — 3x CMS Weight)**
     - *Status in Plan:* 4 Met, 7 Gaps (11 Eligible members).
  2. **`KED` (Kidney Health Evaluation for Diabetes)**
     - *Status in Plan:* 10 Met, 6 Gaps (16 Eligible members).
     - *Eligibility:* Diabetic members aged 18–85.
     - *Numerator Rule:* `MET` only if **BOTH** an eGFR (blood) and uACR (urine albumin-to-creatinine ratio) test are completed in the measurement year.
     - *Why Gaps Occur:* Patient completed bloodwork but missed urine albumin collection (or vice-versa).
     - *Action Protocol:* Dispatch mobile phlebotomy team for combined dual-specimen collection.
  3. **`EED` (Diabetic Eye Exam)**
     - *Status in Plan:* 8 Met, 8 Gaps (16 Eligible members).
     - *Eligibility:* Diabetic members aged 18–75.
     - *Numerator Rule:* `MET` if dilated retinal examination performed by optometrist/ophthalmologist within 24 months.
     - *Why Gaps Occur:* Transportation or scheduling barriers preventing specialist eye appointments.
     - *Action Protocol:* Mobile retinal camera van deployment to community partner centers.

---

### 4. Blue Cross Blue Shield
- **Ownership:** `PRIVATE`
- **Enrolled Population:** 22 Members (9 Gap-Free, 13 With Care Gaps)
- **Star Compliance:** `39.0%` (16 Met / 41 Evaluated Criteria Instances) · **2.6 ★**
- **Clinical Focus:** Preventive Oncology, Comprehensive Annual Wellness & Immunizations.
- **Assigned Measures:**
  1. **`BCS` (Breast Cancer Screening)**
     - *Eligibility:* Female members aged 50–74.
     - *Numerator Rule:* `MET` if bilateral screening mammogram performed within 27 months.
     - *Why Gaps Occur:* Missed routine biennial mammography screening.
     - *Action Protocol:* Dedicated female clinical navigator outreach to coordinate screening slots with childcare/transport support.
  2. **`AWV` (Medicare / Commercial Annual Wellness Visit)**
     - *Status in Plan:* 8 Met, 12 Gaps (20 Eligible members).
     - *Eligibility:* All active enrolled members.
     - *Numerator Rule:* `MET` if comprehensive wellness visit (HCPCS G0438/G0439) completed.
     - *Why Gaps Occur:* Lack of primary care scheduling or failure to complete Health Risk Assessment (HRA).
     - *Action Protocol:* Direct PCP appointment booking via digital patient portal.
  3. **`FVA` (Adult Annual Flu Vaccine)**
     - *Status in Plan:* 8 Met, 12 Gaps (20 Eligible members).

---

### 5. UnitedHealthcare
- **Ownership:** `PRIVATE`
- **Enrolled Population:** 22 Members (17 Gap-Free, 5 With Care Gaps)
- **Star Compliance:** `81.8%` (27 Met / 33 Evaluated Criteria Instances) · **4.3 ★**
- **Clinical Focus:** Diabetic Glycemic & Nephropathy Management with Immunization.
- **Assigned Measures:**
  1. **`HBD_C7` (Hemoglobin A1c Glycemic Control <9%)**
     - *Status in Plan:* 6 Met, 1 Gap (7 Eligible members).
  2. **`KED` (Kidney Health Evaluation for Diabetes)**
     - *Status in Plan:* 4 Met, 3 Gaps (7 Eligible members).
  3. **`FVA` (Adult Annual Flu Vaccine)**
     - *Status in Plan:* 17 Met, 2 Gaps (19 Eligible members).

---

### 6. Cigna Health
- **Ownership:** `PRIVATE`
- **Enrolled Population:** 22 Members (16 Gap-Free, 6 With Care Gaps)
- **Star Compliance:** `84.1%` (37 Met / 44 Evaluated Criteria Instances) · **4.4 ★**
- **Clinical Focus:** Preventive Wellness & Adult Seasonal Immunization.
- **Assigned Measures:**
  1. **`AWV` (Annual Wellness Visit)**
     - *Status in Plan:* 20 Met, 2 Gaps (22 Eligible members).
  2. **`FVA` (Adult Annual Flu Vaccine)**
     - *Status in Plan:* 17 Met, 5 Gaps (22 Eligible members).

---

### 7. Medicaid
- **Ownership:** `GOVERNMENT`
- **Enrolled Population:** 22 Members (12 Gap-Free, 10 With Care Gaps)
- **Star Compliance:** `55.2%` (16 Met / 29 Evaluated Criteria Instances) · **3.2 ★**
- **Clinical Focus:** Blood Pressure Control, Preventive Oncology & Wellness.
- **Assigned Measures:**
  1. **`CBP` (Controlling High Blood Pressure — 3x CMS Weight)**
     - *Status in Plan:* 4 Met, 3 Gaps (7 Eligible members).
  2. **`BCS` (Breast Cancer Screening)**
     - *Status in Plan:* 0 Met, 3 Gaps (3 Eligible female members).
  3. **`AWV` (Annual Wellness Visit)**
     - *Status in Plan:* 12 Met, 7 Gaps (19 Eligible members).

---

### 8. Aetna
- **Ownership:** `PRIVATE`
- **Enrolled Population:** 22 Members (11 Gap-Free, 11 With Care Gaps)
- **Star Compliance:** `70.7%` (29 Met / 41 Evaluated Criteria Instances) · **3.8 ★**
- **Clinical Focus:** Cardiovascular Statin Adherence, Blood Pressure Control & Post-Discharge Transitions.
- **Assigned Measures:**
  1. **`SPD` (Statin Therapy for Patients with Diabetes)**
     - *Status in Plan:* 8 Met, 3 Gaps (11 Eligible members).
  2. **`CBP` (Controlling High Blood Pressure — 3x CMS Weight)**
     - *Status in Plan:* 7 Met, 1 Gap (8 Eligible members).
  3. **`MRP` (Medication Reconciliation Post-Encounter)**
     - *Status in Plan:* 14 Met, 8 Gaps (22 Eligible members).
     - *Eligibility:* Members discharged from acute inpatient hospital stays.
     - *Numerator Rule:* `MET` if medication reconciliation conducted by pharmacist or physician within 30 days of discharge (CPT 1111F).
     - *Why Gaps Occur:* Discharge occurred without documented 30-day transitional medication review.
     - *Action Protocol:* Transitional Care Management (TCM) nurse outreach within 48 hours of discharge.

---

### 9. Anthem
- **Ownership:** `PRIVATE`
- **Enrolled Population:** 22 Members (8 Gap-Free, 14 With Care Gaps)
- **Star Compliance:** `51.4%` (19 Met / 37 Evaluated Criteria Instances) · **3.1 ★**
- **Clinical Focus:** Acute Care Transitions & Hypertension Management.
- **Assigned Measures:**
  1. **`MRP` (Medication Reconciliation Post-Encounter)**
     - *Status in Plan:* 12 Met, 10 Gaps (22 Eligible members).
  2. **`CBP` (Controlling High Blood Pressure — 3x CMS Weight)**
     - *Status in Plan:* 7 Met, 8 Gaps (15 Eligible members).

---

### 10. NO_INSURANCE (Uninsured)
- **Ownership:** `NO_INSURANCE`
- **Enrolled Population:** 22 Members (22 Gap-Free / 0 Applicable)
- **Star Compliance:** `0.0%` (0 Applicable Measures) · **1.0 ★**
- **Clinical Focus:** Exempt from CMS Medicare Advantage and commercial HEDIS quality ratings (no payer contract).
- **Assigned Measures:** *None (0 Measures Assigned)*.
- **Recommended Action:** Patient navigation to MassHealth (Medicaid) eligibility screening or ACA Health Connector enrollment.

---

## 4. Complete NCQA HEDIS Measure Master Catalog

| Code | Clinical Measure Name | Clinical Domain | CMS Weight | Target Rate | Lookback Window | Criteria Rule Summary |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **`CBP`** | Controlling High Blood Pressure | Cardiovascular | **3x** | `80.0%` | Measurement Year | Hypertensive patients aged 18–85. `MET` if last outpatient BP $< 140/90\text{ mmHg}$. |
| **`HBD_C7`** | HbA1c Control for Diabetics (<9%) | Diabetes Management | **1x** | `75.0%` | Measurement Year | Diabetic patients aged 18–75. `MET` if most recent lab HbA1c $< 9.0\%$. |
| **`EED`** | Diabetic Retinal Eye Exam | Diabetes Management | **1x** | `72.0%` | 24 Months Rolling | Diabetic patients aged 18–75. `MET` if dilated retinal exam documented by eye doctor. |
| **`SPD`** | Statin Therapy for Diabetes | Cardiovascular / Rx | **1x** | `82.0%` | Measurement Year | Diabetic patients aged 40–75. `MET` if $\ge 1$ statin prescription filled with $\text{PDC} \ge 80\%$. |
| **`KED`** | Kidney Health Evaluation | Diabetes Management | **1x** | `68.0%` | Measurement Year | Diabetic patients aged 18–85. `MET` if **both** eGFR blood and uACR urine tests are done. |
| **`BCS`** | Breast Cancer Screening | Women's Health | **1x** | `74.0%` | 27 Months | Female members aged 50–74. `MET` if screening mammogram completed. |
| **`FVA`** | Adult Annual Flu Vaccine | Immunization | **1x** | `80.0%` | July 1 – June 30 | All active members. `MET` if influenza immunization documented in active flu season. |
| **`AWV`** | Annual Wellness Visit | Preventive Care | **1x** | `70.0%` | Calendar Year | Enrolled members. `MET` if annual wellness exam (G0438/G0439) completed. |
| **`MRP`** | Medication Reconciliation Post-Encounter | Care Transitions / Safety | **1x** | `75.0%` | 30 Days Post-Discharge | Inpatient discharges. `MET` if pharmacist/MD med review documented within 30 days. |

---

## 5. Mathematical Formulas & Scoring Rules

### 1. Plan Compliance Percentage:
$$\text{Plan Compliance Rate (\%)} = \frac{\sum \text{MET Criteria Instances}}{\sum \text{Applicable Criteria Instances (MET + GAP)}} \times 100$$

### 2. Plan Star Rating (1.0 to 5.0 ★):
$$\text{Plan Star Rating} = 1.0 + \left(\frac{\text{Plan Compliance Rate}}{100} \times 4.0\right)$$

### 3. Performance Classification Cutpoints:
- **High Performing (Green):** $\ge 80.0\%$ (Star Rating $\ge 4.2 ★$)
- **Moderate Performance (Amber):** $60.0\% - 79.9\%$ (Star Rating $3.4 ★ - 4.1 ★$)
- **At Risk (Red):** $< 60.0\%$ (Star Rating $< 3.4 ★$)

### 4. Priority Engine Architecture:
The patient priority score (`PRIORITY`) is preserved as an isolated modular calculation in `frontend/src/utils/metricsEngine.js`. When updated, multi-factorial weighting (CMS 3x weight for `CBP`, cutpoint distance, chronic comorbidity index, and member reachability) can be dropped in without altering the UI schema.

---
*CareImpact Documentation · NCQA HEDIS MY2026 / CMS Star Ratings Specifications*
