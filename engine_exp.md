# CareImpact Engine Documentation: Star Engine, Priority Engine & Threshold Calculation

> **Document Version:** 1.0  
> **Target Standard:** NCQA HEDIS Measurement Year 2026 / CMS Medicare Advantage Star Ratings  
> **Source Modules:** `data/CareImpact_star_Engine/` & `data/CareImpact_Priority_Engine/`

---

## 1. Executive Architecture Overview

CareImpact operates using **two unified, high-precision mathematical engines** that work in tandem to evaluate healthcare plan quality and optimize clinical outreach:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CAREIMPACT ARCHITECTURE                              │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│           1. CAREIMPACT STAR ENGINE       │        2. CAREIMPACT PRIORITY ENGINE       │
├───────────────────────────────────────────┼────────────────────────────────────────────┤
│ • Evaluates Compliance Rate ($P_m$)       │ • Quantifies Gap Opportunity ($O_m$)       │
│ • Maps Performance to CMS Cutpoints       │ • Calculates Next-Star Reachability ($R_m$)│
│ • Measures Distance to Next Star ($D_m$)  │ • Computes Measure Priority Score ($Q_m$)  │
│ • Applies CMS 3x Weights ($W_m$)          │ • Assigns Patient-Level Priority (1–100)   │
│ • Simulates "What-If" Gap Closures ($G_m$)│ • Filters Gap-Free Members ($0$ Score)     │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
```

---

## 2. Threshold (Cutpoint) Calculation & Methodology

### What is a Cutpoint Threshold?
A **Cutpoint (Threshold)** is the minimum performance percentage ($0.0\% - 100.0\%$) required for a health plan to achieve a specific Star rating ($1★, 2★, 3★, 4★, 5★$) for a clinical measure.

```
0%              50%            65%            75%            85%           100%
 ├───────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
 │      1 ★      │     2 ★      │     3 ★      │     4 ★      │     5 ★      │
 └───────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
              Cutpoint 2     Cutpoint 3     Cutpoint 4     Cutpoint 5
               (50.0%)        (65.0%)        (75.0%)        (85.0%)
```

### Complete Measure Cutpoint Reference Table

| Measure Code | Clinical Measure Name | CMS Weight ($W_m$) | 1 ★ | 2 ★ | 3 ★ | 4 ★ | 5 ★ | Benchmark Target |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`CBP`** | Controlling High Blood Pressure | **3x** *(Triple)* | $< 50\%$ | **$\ge 50.0\%$** | **$\ge 65.0\%$** | **$\ge 75.0\%$** | **$\ge 85.0\%$** | `80.0%` |
| **`HBD_C7`** | HbA1c Glycemic Control (<9%) | **1x** | $< 45\%$ | **$\ge 45.0\%$** | **$\ge 60.0\%$** | **$\ge 72.0\%$** | **$\ge 82.0\%$** | `75.0%` |
| **`EED`** | Diabetic Retinal Eye Exam | **1x** | $< 40\%$ | **$\ge 40.0\%$** | **$\ge 55.0\%$** | **$\ge 68.0\%$** | **$\ge 80.0\%$** | `72.0%` |
| **`SPD`** | Statin Therapy for Diabetes | **1x** | $< 55\%$ | **$\ge 55.0\%$** | **$\ge 70.0\%$** | **$\ge 80.0\%$** | **$\ge 88.0\%$** | `82.0%` |
| **`KED`** | Kidney Health Evaluation | **1x** | $< 35\%$ | **$\ge 35.0\%$** | **$\ge 50.0\%$** | **$\ge 65.0\%$** | **$\ge 78.0\%$** | `68.0%` |
| **`BCS`** | Breast Cancer Screening | **1x** | $< 45\%$ | **$\ge 45.0\%$** | **$\ge 60.0\%$** | **$\ge 72.0\%$** | **$\ge 82.0\%$** | `74.0%` |
| **`FVA`** | Adult Annual Flu Vaccine | **1x** | $< 50\%$ | **$\ge 50.0\%$** | **$\ge 65.0\%$** | **$\ge 78.0\%$** | **$\ge 86.0\%$** | `80.0%` |
| **`AWV`** | Annual Wellness Visit | **1x** | $< 40\%$ | **$\ge 40.0\%$** | **$\ge 55.0\%$** | **$\ge 68.0\%$** | **$\ge 80.0\%$** | `70.0%` |
| **`MRP`** | Post-Discharge Med Reconciliation | **1x** | $< 45\%$ | **$\ge 45.0\%$** | **$\ge 60.0\%$** | **$\ge 72.0\%$** | **$\ge 84.0\%$** | `75.0%` |

---

## 3. The Star Engine (`CareImpact_star_Engine`)

The Star Engine calculates current performance, distance to target cutpoints, and projected Star ratings under simulated gap closures.

### The 6-Step Mathematical Decision Pipeline

$$\text{Member Data} \longrightarrow P_m \longrightarrow D_m \longrightarrow Q_m \longrightarrow G_m \longrightarrow P_m' \longrightarrow \text{Star}_m'$$

```
   ┌────────────────────┐
   │ Member Roster Data │ (Eligible Em, Compliant Cm, Gaps)
   └─────────┬──────────┘
             ▼
   ┌────────────────────┐
   │ 1. Performance Pm  │  Pm = (Cm / Em) * 100
   └─────────┬──────────┘
             ▼
   ┌────────────────────┐
   │ 2. Star & Distance │  Current Star = max(Star | Pm >= Cutoff)
   │        (Dm)        │  Dm = S_next - Pm
   └─────────┬──────────┘
             ▼
   ┌────────────────────┐
   │ 3. Priority (Qm)   │  Qm = Wm * (1 - Dm/S) * 50 + Rm
   └─────────┬──────────┘
             ▼
   ┌────────────────────┐
   │ 4. Simulation (Gm) │  Input hypothetical gaps closed: Gm
   └─────────┬──────────┘
             ▼
   ┌────────────────────┐
   │ 5. Projected Pm'   │  Pm' = (min(Cm + Gm, Em) / Em) * 100
   └─────────┬──────────┘
             ▼
   ┌────────────────────┐
   │ 6. Projected Star' │  Star_m' = f(Pm', CMS Cutpoints)
   └────────────────────┘
```

### Formula Definitions:

#### 1. Measure Compliance Rate ($P_m$):
$$P_m = \left(\frac{C_m}{E_m}\right) \times 100$$
- $E_m$ = Eligible members in denominator
- $C_m$ = Compliant (`MET`) members in numerator

#### 2. Current Star Level Assignment:
$$\text{Current Star}_m = \max \left\{ \text{Star} \;\middle|\; P_m \ge \text{Cutpoint}(\text{Star}) \right\}$$

#### 3. Distance to Next Star ($D_m$):
$$D_m = \text{Cutpoint}_{\text{next}} - P_m$$
*(If the measure is already 5★, $D_m = 0.0$).*

#### 4. Projected Performance ($P_m'$) after Closing $G_m$ Gaps:
$$P_m' = \left(\frac{\min(C_m + G_m, E_m)}{E_m}\right) \times 100$$

#### 5. Plan-Level CMS Weighted Star Rating:
$$\text{Plan Overall Star Rating} = \frac{\sum_{m \in \text{Plan}} \left(\text{Star}_m \times W_m\right)}{\sum_{m \in \text{Plan}} W_m}$$
*(Where $W_{\text{CBP}} = 3.0$ and other measures $W_m = 1.0$).*

---

## 4. The Priority Engine (`CareImpact_Priority_Engine`)

The Priority Engine evaluates **Opportunity (Volume)** and **Reachability (Feasibility)** to determine which care gaps should be closed first.

### Mathematical Formulation:

#### Step 1: Gap Opportunity ($O_m$)
$$\text{Number of Gaps}_m = E_m - C_m$$
$$O_m = \frac{\text{Number of Gaps}_m}{\max(\text{Gaps across Plan Portfolio})}$$
*(A higher gap count means a larger volume of quality improvement opportunity).*

#### Step 2: Next-Star Reachability ($R_m$)
1. **Gaps Needed to Cross Cutpoint:**
   $$G_{\text{needed}} = \left\lceil \left(\frac{D_m}{100}\right) \times E_m \right\rceil$$
2. **Reachability Percentage ($R_m$):**
   $$R_m = \max\left(0, \left(1 - \frac{G_{\text{needed}}}{\text{Available Gaps}_m}\right) \times 100\right)$$
   *(Higher reachability means fewer members are required to flip the measure to the next Star level).*

#### Step 3: Measure Quality Priority Score ($Q_m$) (0–100 Scale)
$$Q_m = \left(O_m \times 45.0 + \frac{R_m}{100.0} \times 45.0 + \frac{W_m}{3.0} \times 10.0\right) \times \text{WeightFactor}$$
*(Triple-weight measures like `CBP` receive a multiplier bonus).*

#### Step 4: Patient-Level Priority Scoring (0–100 Scale)
For any patient $i$ in the plan:
- If patient is **Gap-Free** (`hasCareGap == false`): $\mathbf{\text{Priority} = 0}$
- If patient has **Open Gaps** across measures $M_i$:
  $$\text{Patient Priority} = \min\left(100, \max\left(1, \frac{\sum_{m \in M_i} Q_m \times (\text{TripleWeightBonus})}{|M_i|}\right)\right)$$

---

## 5. Edge Cases & Boundary Handling

| # | Edge Case Scenario | Mathematical Risk | Engine Protection & Handling |
| :-: | :--- | :--- | :--- |
| **1** | **Gap-Free Members** | Wasting clinical resources on compliant patients | Priority is immediately set to `0`. |
| **2** | **Measure Already at 5★** | $S_{\text{next}} = \text{null} \rightarrow$ `NullReference` / `NaN` | Set $D_m = 0.0$, $G_{\text{needed}} = 0$, $R_m = 100.0\%$. |
| **3** | **0 Available Gaps in Reachability** | Division by zero: $(1 - G_{\text{needed}} / 0)$ | Guarded: returns $100.0\%$ reachability if $0$ gaps exist. |
| **4** | **Gaps Needed > Available Gaps** | Negative reachability (e.g. $1 - 5/2 = -150\%$) | Bounded with $\max(0.0, \min(100.0, R_m))$. |
| **5** | **0 Eligible Members ($E_m = 0$)** | Division by zero in compliance rate | Returns $P_m = 0.0\%$ and marks measure `N/A`. |
| **6** | **Multi-Gap Patients** | Patient with 2 or 3 open gaps | Averages open gap priority with 3x weight amplification for `CBP`. |
| **7** | **Uninsured Cohort (`NO_INSURANCE`)** | $0$ applicable measures | Safely returns $0$ priority and $1.0★$ baseline. |

---

## 6. Numerical Walkthrough: Real Data Comparison

### Case 1: Medicare Plan
- **`CBP` (Blood Pressure, 3x Weight):**
  - $E_m = 11, C_m = 8, \text{Gaps} = 3 \longrightarrow P_m = 72.7\%$
  - Current Star: **3 ★** (Cutpoint $65.0\%$)
  - Next Star: **4 ★** (Cutpoint $75.0\%$)
  - Distance: $75.0\% - 72.7\% = 2.3\%$
  - $G_{\text{needed}} = \lceil (2.3/100) \times 11 \rceil = \mathbf{1\text{ patient}}$
  - Reachability: $(1 - 1/3) \times 100 = \mathbf{66.7\%}$
  - **Priority Score: `78 / 100`** *(Top priority for care management)*
- **`HBD_C7` (HbA1c, 1x Weight):**
  - $E_m = 7, C_m = 7, \text{Gaps} = 0 \longrightarrow P_m = 100.0\%$ (Current: **5 ★**)
- **`FVA` (Flu Vaccine, 1x Weight):**
  - $E_m = 21, C_m = 19, \text{Gaps} = 2 \longrightarrow P_m = 90.5\%$ (Current: **5 ★**)

### Case 2: Humana Plan
- **`CBP` (Blood Pressure, 3x Weight):**
  - $E_m = 5, C_m = 2, \text{Gaps} = 3 \longrightarrow P_m = 40.0\%$ (Current: **1 ★**, Next: 2★ at $50\%$)
  - $G_{\text{needed}} = \lceil (10.0/100) \times 5 \rceil = \mathbf{1\text{ patient}}$
  - Reachability: $(1 - 1/3) \times 100 = \mathbf{66.7\%}$
- **`SPD` (Statin Therapy, 1x Weight):**
  - $E_m = 2, C_m = 0, \text{Gaps} = 2 \longrightarrow P_m = 0.0\%$ (Current: **1 ★**, Next: 2★ at $55\%$)
  - $G_{\text{needed}} = \lceil (55.0/100) \times 2 \rceil = \mathbf{2\text{ patients}}$
  - Reachability: $(1 - 2/2) \times 100 = \mathbf{0.0\%}$

---
*CareImpact Engine Specification · NCQA HEDIS MY2026 / CMS Star Ratings*
