/**
 * @file metricsEngine.js
 * @description Comprehensive CareImpact Star Rating & Priority Calculation Engine.
 * Integrates:
 * 1. CareImpact_star_Engine (Measure Performance, Next Star Cutpoints, Distance Dm, CMS Weights Wm, Simulation)
 * 2. CareImpact_Priority_Engine (Gap Opportunity, Next-Star Reachability Rm, Priority Score Qm)
 * 3. Plan Disease Affiliations & Criteria Mapping
 */

/**
 * NCQA HEDIS MY2026 / CMS Medicare Advantage Measure Cutpoints
 */
export const CMS_MEASURE_CUTPOINTS = {
  CBP: { 1: 0.0, 2: 50.0, 3: 65.0, 4: 75.0, 5: 85.0 }, // Controlling High Blood Pressure (3x Weight)
  HBD_C7: { 1: 0.0, 2: 45.0, 3: 60.0, 4: 72.0, 5: 82.0 }, // HbA1c Control (<9%) (1x Weight)
  EED: { 1: 0.0, 2: 40.0, 3: 55.0, 4: 68.0, 5: 80.0 }, // Diabetic Eye Exam (1x Weight)
  SPD: { 1: 0.0, 2: 55.0, 3: 70.0, 4: 80.0, 5: 88.0 }, // Statin Therapy for Diabetes (1x Weight)
  KED: { 1: 0.0, 2: 35.0, 3: 50.0, 4: 65.0, 5: 78.0 }, // Kidney Health Evaluation (1x Weight)
  BCS: { 1: 0.0, 2: 45.0, 3: 60.0, 4: 72.0, 5: 82.0 }, // Breast Cancer Screening (1x Weight)
  FVA: { 1: 0.0, 2: 50.0, 3: 65.0, 4: 78.0, 5: 86.0 }, // Adult Annual Flu Vaccine (1x Weight)
  AWV: { 1: 0.0, 2: 40.0, 3: 55.0, 4: 68.0, 5: 80.0 }, // Annual Wellness Visit (1x Weight)
  MRP: { 1: 0.0, 2: 45.0, 3: 60.0, 4: 72.0, 5: 84.0 }, // Medication Reconciliation Post-Encounter (1x Weight)
};

/**
 * Plan to Disease & Measure Affiliation Master Map
 */
export const PLAN_DISEASE_AFFILIATIONS = {
  Medicare: {
    company: 'Medicare',
    targetPopulation: 'Senior Medicare Beneficiaries (Age 65+ / Disability)',
    diseases: [
      {
        diseaseName: 'Essential Hypertension',
        code: 'CBP',
        measureName: 'Controlling High Blood Pressure',
        cmsWeight: 3,
        clinicalRationale: 'Hypertension is the primary driver of stroke, MI, and heart failure in senior populations.',
      },
      {
        diseaseName: 'Type 1 & Type 2 Diabetes Mellitus',
        code: 'HBD_C7',
        measureName: 'Hemoglobin A1c Glycemic Control (<9%)',
        cmsWeight: 1,
        clinicalRationale: 'Glycemic stabilization prevents severe diabetic ketoacidosis and acute microvascular damage.',
      },
      {
        diseaseName: 'Geriatric Respiratory Vulnerability',
        code: 'FVA',
        measureName: 'Adult Annual Influenza Vaccine',
        cmsWeight: 1,
        clinicalRationale: 'Seasonal influenza causes disproportionately severe hospitalization and mortality in older adults.',
      },
    ],
  },
  Humana: {
    company: 'Humana',
    targetPopulation: 'Medicare Advantage Enrollees with Chronic Conditions',
    diseases: [
      {
        diseaseName: 'Cardiovascular Hypertension',
        code: 'CBP',
        measureName: 'Controlling High Blood Pressure',
        cmsWeight: 3,
        clinicalRationale: 'Triple-weighted measure vital for preventing acute cardiovascular hospitalization.',
      },
      {
        diseaseName: 'Type 2 Diabetes Mellitus',
        code: 'HBD_C7',
        measureName: 'Hemoglobin A1c Glycemic Control (<9%)',
        cmsWeight: 1,
        clinicalRationale: 'Ensures glycemic control through continuous monitoring and nurse care management.',
      },
      {
        diseaseName: 'Diabetic Atherosclerotic Cardiovascular Disease (ASCVD)',
        code: 'SPD',
        measureName: 'Statin Therapy for Patients with Diabetes',
        cmsWeight: 1,
        clinicalRationale: 'Primary cardiovascular event prevention via daily statin medication adherence (PDC ≥ 80%).',
      },
    ],
  },
  'Dual Eligible': {
    company: 'Dual Eligible',
    targetPopulation: 'Low-Income Complex Chronic Beneficiaries (Medicare + Medicaid)',
    diseases: [
      {
        diseaseName: 'Hypertensive Vascular Disease',
        code: 'CBP',
        measureName: 'Controlling High Blood Pressure',
        cmsWeight: 3,
        clinicalRationale: 'High-risk cardiovascular control in multi-morbid dual beneficiaries.',
      },
      {
        diseaseName: 'Diabetic Nephropathy / Chronic Kidney Disease (CKD)',
        code: 'KED',
        measureName: 'Kidney Health Evaluation for Diabetes',
        cmsWeight: 1,
        clinicalRationale: 'Annual eGFR and uACR testing detects early-stage diabetic kidney damage before dialysis stage.',
      },
      {
        diseaseName: 'Diabetic Retinopathy',
        code: 'EED',
        measureName: 'Eye Exam for Patients with Diabetes',
        cmsWeight: 1,
        clinicalRationale: 'Dilated retinal imaging prevents preventable diabetic blindness and vision impairment.',
      },
    ],
  },
  'Blue Cross Blue Shield': {
    company: 'Blue Cross Blue Shield',
    targetPopulation: 'Commercial & Employer Group Enrollees',
    diseases: [
      {
        diseaseName: "Preventive Oncology (Women's Health)",
        code: 'BCS',
        measureName: 'Breast Cancer Screening',
        cmsWeight: 1,
        clinicalRationale: 'Biennial screening mammography enables early detection and curative treatment of breast cancer.',
      },
      {
        diseaseName: 'Comprehensive Health Maintenance',
        code: 'AWV',
        measureName: 'Annual Wellness Visit',
        cmsWeight: 1,
        clinicalRationale: 'Comprehensive yearly health risk assessment and preventive care plan development.',
      },
      {
        diseaseName: 'Community Viral Immunization',
        code: 'FVA',
        measureName: 'Adult Annual Influenza Vaccine',
        cmsWeight: 1,
        clinicalRationale: 'Reduces workplace absenteeism and seasonal viral complications across adult cohort.',
      },
    ],
  },
  UnitedHealthcare: {
    company: 'UnitedHealthcare',
    targetPopulation: 'Medicare Advantage Chronic Care Members',
    diseases: [
      {
        diseaseName: 'Type 2 Diabetes Glycemic Stability',
        code: 'HBD_C7',
        measureName: 'Hemoglobin A1c Glycemic Control (<9%)',
        cmsWeight: 1,
        clinicalRationale: 'Quarterly glycemic surveillance for diabetic members.',
      },
      {
        diseaseName: 'Diabetic Nephropathy & Renal Function',
        code: 'KED',
        measureName: 'Kidney Health Evaluation for Diabetes',
        cmsWeight: 1,
        clinicalRationale: 'Coordinated urine and serum lab panels to monitor glomerular filtration rate.',
      },
      {
        diseaseName: 'Adult Preventive Immunization',
        code: 'FVA',
        measureName: 'Adult Annual Influenza Vaccine',
        cmsWeight: 1,
        clinicalRationale: 'Broad population vaccination against seasonal influenza strains.',
      },
    ],
  },
  'Cigna Health': {
    company: 'Cigna Health',
    targetPopulation: 'Commercial & Preventive Health Members',
    diseases: [
      {
        diseaseName: 'Preventive Primary Health Maintenance',
        code: 'AWV',
        measureName: 'Annual Wellness Visit',
        cmsWeight: 1,
        clinicalRationale: 'Establishes primary care touchpoint for personalized health risk evaluations.',
      },
      {
        diseaseName: 'Seasonal Respiratory Immunization',
        code: 'FVA',
        measureName: 'Adult Annual Influenza Vaccine',
        cmsWeight: 1,
        clinicalRationale: 'Maximizes community immunity against virulent seasonal flu strains.',
      },
    ],
  },
  Medicaid: {
    company: 'Medicaid',
    targetPopulation: 'State Medicaid MCO Beneficiaries',
    diseases: [
      {
        diseaseName: 'Hypertension in Underserved Cohorts',
        code: 'CBP',
        measureName: 'Controlling High Blood Pressure',
        cmsWeight: 3,
        clinicalRationale: 'Reduces cardiovascular disparities through blood pressure control.',
      },
      {
        diseaseName: "Preventive Oncology (Women's Health)",
        code: 'BCS',
        measureName: 'Breast Cancer Screening',
        cmsWeight: 1,
        clinicalRationale: 'Ensures equitable access to screening mammography for low-income women aged 50-74.',
      },
      {
        diseaseName: 'Preventive Health Assessment',
        code: 'AWV',
        measureName: 'Annual Wellness Visit',
        cmsWeight: 1,
        clinicalRationale: 'Addresses social determinants of health (SDOH) during comprehensive annual visits.',
      },
    ],
  },
  Aetna: {
    company: 'Aetna',
    targetPopulation: 'Medicare Advantage Enrollees with Cardiovascular & Acute Inpatient History',
    diseases: [
      {
        diseaseName: 'Diabetic Dyslipidemia / ASCVD',
        code: 'SPD',
        measureName: 'Statin Therapy for Patients with Diabetes',
        cmsWeight: 1,
        clinicalRationale: 'Ensures statin prescription fulfillment and refill continuity.',
      },
      {
        diseaseName: 'Essential Hypertension',
        code: 'CBP',
        measureName: 'Controlling High Blood Pressure',
        cmsWeight: 3,
        clinicalRationale: 'Triple-weight blood pressure maintenance below 140/90 mmHg.',
      },
      {
        diseaseName: 'Inpatient Discharge Care Transitions',
        code: 'MRP',
        measureName: 'Medication Reconciliation Post-Encounter',
        cmsWeight: 1,
        clinicalRationale: 'Pharmacist-led medication reconciliation within 30 days of discharge prevents readmissions.',
      },
    ],
  },
  Anthem: {
    company: 'Anthem',
    targetPopulation: 'Acute Care Transitions & Cardiovascular Enrollees',
    diseases: [
      {
        diseaseName: 'Post-Hospitalization Care Transitions',
        code: 'MRP',
        measureName: 'Medication Reconciliation Post-Encounter',
        cmsWeight: 1,
        clinicalRationale: 'Clinical pharmacist reconciliation within 30 days of hospital discharge.',
      },
      {
        diseaseName: 'Hypertension & Cardiovascular Risk',
        code: 'CBP',
        measureName: 'Controlling High Blood Pressure',
        cmsWeight: 3,
        clinicalRationale: 'Mitigates post-acute hypertensive crises and readmissions.',
      },
    ],
  },
  NO_INSURANCE: {
    company: 'NO_INSURANCE',
    targetPopulation: 'Uninsured Patients (Exempt from Quality Ratings)',
    diseases: [],
  },
};

/**
 * NCQA HEDIS Measure Master Catalog with Clinical Criteria Rules
 */
export const CLINICAL_MEASURE_CATALOG = {
  CBP: {
    code: 'CBP',
    name: 'Controlling High Blood Pressure',
    domain: 'Cardiovascular',
    cmsWeight: 3,
    targetRate: '80.0%',
    criteriaRule: 'Age 18-85 with Hypertension. Numerator compliant if last outpatient BP < 140/90 mmHg.',
    whyGapsOccur:
      'Member blood pressure was recorded ≥ 140 mmHg systolic or ≥ 90 mmHg diastolic, or no outpatient vitals reading was documented during the measurement year.',
    clinicalAction:
      'Schedule clinical care manager callback, provide home BP telemonitoring cuff, and initiate physician medication titration protocol.',
  },
  HBD_C7: {
    code: 'HBD_C7',
    name: 'Hemoglobin A1c Control (<9%)',
    domain: 'Diabetes Management',
    cmsWeight: 1,
    targetRate: '75.0%',
    criteriaRule: 'Age 18-75 with Diabetes. Numerator compliant if most recent HbA1c < 9.0%.',
    whyGapsOccur:
      'Most recent lab HbA1c level was ≥ 9.0% (poorly controlled) or no glycemic lab panel was performed during the measurement year.',
    clinicalAction:
      'Order in-home lab blood collection kit or lab requisition; enroll member in diabetic nurse nutrition and continuous glucose monitoring program.',
  },
  EED: {
    code: 'EED',
    name: 'Eye Exam for Patients with Diabetes',
    domain: 'Diabetes Management',
    cmsWeight: 1,
    targetRate: '72.0%',
    criteriaRule: 'Age 18-75 with Diabetes. Numerator compliant if dilated retinal eye exam performed in measurement year or prior year.',
    whyGapsOccur:
      'No claim or documentation found for a dilated retinal eye exam by an optometrist or ophthalmologist within the 24-month rolling lookback window.',
    clinicalAction:
      'Deploy mobile retinal camera van or coordinate non-emergency medical transportation to preferred eye specialist network.',
  },
  SPD: {
    code: 'SPD',
    name: 'Statin Therapy for Patients with Diabetes',
    domain: 'Cardiovascular / Rx',
    cmsWeight: 1,
    targetRate: '82.0%',
    criteriaRule: 'Age 40-75 with Diabetes. Numerator compliant if at least 1 statin prescription fill with PDC ≥ 80%.',
    whyGapsOccur:
      'Pharmacy claims reflect no active statin fills or Proportion of Days Covered (PDC) fallen below the 80% adherence threshold.',
    clinicalAction:
      'Perform pharmacy consultation to assess statin-associated muscle symptoms, switch to hydrophilic alternative (pravastatin/rosuvastatin), and set 90-day mail-order auto-refill.',
  },
  KED: {
    code: 'KED',
    name: 'Kidney Health Evaluation for Diabetes',
    domain: 'Diabetes Management',
    cmsWeight: 1,
    targetRate: '68.0%',
    criteriaRule: 'Age 18-85 with Diabetes. Numerator compliant if BOTH an eGFR blood test and uACR urine albumin test performed in year.',
    whyGapsOccur:
      'Member completed only eGFR blood test or only uACR urine test, or missed both annual diabetic nephropathy screening labs.',
    clinicalAction:
      'Issue combination kidney lab order at outpatient diagnostic center or dispatch mobile phlebotomist for dual specimen draw.',
  },
  BCS: {
    code: 'BCS',
    name: 'Breast Cancer Screening',
    domain: "Women's Health",
    cmsWeight: 1,
    targetRate: '74.0%',
    criteriaRule: 'Women aged 50-74. Numerator compliant if bilateral screening mammogram performed within past 27 months.',
    whyGapsOccur:
      'No screening mammogram claim recorded in the 27-month lookback period; missing annual preventive imaging.',
    clinicalAction:
      'Outreach from female clinical navigator to schedule screening appointment at partnered mammography center with barrier assistance.',
  },
  FVA: {
    code: 'FVA',
    name: 'Adult Annual Flu Vaccine',
    domain: 'Immunization',
    cmsWeight: 1,
    targetRate: '80.0%',
    criteriaRule: 'All enrolled members. Numerator compliant if influenza vaccine received between July 1 and June 30.',
    whyGapsOccur:
      'No influenza vaccine documented in state registry or claims during the current flu season window.',
    clinicalAction:
      'Send digital SMS pharmacy voucher for zero-copay flu shot at CVS/Walgreens or schedule in-home flu clinic for homebound seniors.',
  },
  AWV: {
    code: 'AWV',
    name: 'Medicare Annual Wellness Visit',
    domain: 'Preventive Care',
    cmsWeight: 1,
    targetRate: '70.0%',
    criteriaRule: 'Enrolled members. Numerator compliant if Medicare Annual Wellness Visit (G0438/G0439) completed in calendar year.',
    whyGapsOccur:
      'Member has not completed their comprehensive Medicare health risk assessment and personalized prevention plan for the year.',
    clinicalAction:
      'Book 45-minute Annual Wellness Visit (in-person or telehealth) with PCP to review functional status, cognitive assessment, and screening schedule.',
  },
  MRP: {
    code: 'MRP',
    name: 'Medication Reconciliation Post-Encounter',
    domain: 'Care Transitions / Safety',
    cmsWeight: 1,
    targetRate: '75.0%',
    criteriaRule: 'Members discharged from acute hospital stay. Numerator compliant if medication reconciliation documented within 30 days.',
    whyGapsOccur:
      'Acute inpatient discharge occurred without documented pharmacist or physician medication reconciliation within 30 calendar days.',
    clinicalAction:
      'Trigger automated transitional care management call within 48 hours of discharge; clinical pharmacist conducts 30-day med review.',
  },
};

// =============================================================================
// CAREIMPACT FORMULA & DECISION ENGINE FUNCTIONS
// =============================================================================

/**
 * Determines current Star level (1–5) based on performance percentage and cutpoints.
 */
export function determineStar(performancePct, cutpoints = { 1: 0, 2: 50, 3: 65, 4: 75, 5: 85 }) {
  const eligibleStars = Object.entries(cutpoints)
    .filter(([_, cutoff]) => performancePct >= cutoff)
    .map(([star]) => Number(star));

  if (eligibleStars.length === 0) {
    return Math.min(...Object.keys(cutpoints).map(Number));
  }
  return Math.max(...eligibleStars);
}

/**
 * Finds the next Star level and cutpoint above current performance.
 */
export function findNextStar(performancePct, cutpoints = { 1: 0, 2: 50, 3: 65, 4: 75, 5: 85 }) {
  const higherCutpoints = Object.entries(cutpoints)
    .map(([star, cutoff]) => ({ star: Number(star), cutoff }))
    .filter((item) => item.cutoff > performancePct);

  if (higherCutpoints.length === 0) {
    return { nextStar: null, nextCutpoint: null };
  }

  const next = higherCutpoints.reduce((min, curr) => (curr.cutoff < min.cutoff ? curr : min));
  return { nextStar: next.star, nextCutpoint: next.cutoff };
}

/**
 * Evaluates full Priority Engine metrics for a clinical measure:
 * 1. Number of Gaps: Em - Cm
 * 2. Next-Star Reachability Rm: (1 - Gaps Needed / Available Gaps) * 100
 * 3. Priority Score: (Gap Opportunity * 50) + (Reachability * 50) + (CMS Weight Bonus)
 */
export function evaluateMeasurePriority(eligibleMembers, compliantMembers, measureCode, maxGapsInPortfolio = 1) {
  const cutpoints = CMS_MEASURE_CUTPOINTS[measureCode] || { 1: 0, 2: 50, 3: 65, 4: 75, 5: 85 };
  const cmsWeight = CLINICAL_MEASURE_CATALOG[measureCode]?.cmsWeight || 1;

  const gaps = Math.max(0, eligibleMembers - compliantMembers);
  const performancePct = eligibleMembers > 0
    ? Math.round((compliantMembers / eligibleMembers) * 1000) / 10
    : 0.0;

  const currentStar = determineStar(performancePct, cutpoints);
  const { nextStar, nextCutpoint } = findNextStar(performancePct, cutpoints);

  let performanceGap = 0.0;
  let gapsNeeded = 0;
  let reachabilityPct = 0.0;

  if (nextStar !== null && nextCutpoint !== null) {
    performanceGap = Math.round((nextCutpoint - performancePct) * 10) / 10;
    gapsNeeded = Math.ceil((performanceGap / 100.0) * eligibleMembers);

    if (gaps > 0) {
      reachabilityPct = Math.max(0.0, Math.min(100.0, (1.0 - gapsNeeded / gaps) * 100.0));
      reachabilityPct = Math.round(reachabilityPct * 10) / 10;
    }
  } else {
    reachabilityPct = 100.0; // Already at 5 Stars
  }

  // Gap Opportunity normalized (0 to 1)
  const gapOpportunity = maxGapsInPortfolio > 0 ? gaps / maxGapsInPortfolio : 0.0;

  // Multi-factor Priority Score (0 to 100 scale, weighted by CMS importance)
  // Triple-weight measures like CBP get a boost in reachability weight
  const weightFactor = cmsWeight >= 3 ? 1.2 : 1.0;
  let priorityScore = (gapOpportunity * 45.0 + (reachabilityPct / 100.0) * 45.0 + (cmsWeight / 3.0) * 10.0) * weightFactor;
  priorityScore = Math.max(0, Math.min(100, Math.round(priorityScore)));

  return {
    measureCode,
    eligibleMembers,
    compliantMembers,
    numberOfGaps: gaps,
    currentPerformancePct: performancePct,
    currentStar,
    nextStar,
    nextStarCutpoint: nextCutpoint,
    performanceGapToNextStar: performanceGap,
    gapsNeededForNextStar: gapsNeeded,
    reachabilityPct,
    cmsWeight,
    priorityScore,
  };
}

/**
 * Computes the aggregate Star Rating and Plan-Level priority summary for a list of member records.
 */
export function computeStarRating(members = [], planName = 'Medicare') {
  if (!members || members.length === 0) {
    return {
      starPct: 0,
      starValue: 1.0,
      totalEvaluatedMeasures: 0,
      totalGaps: 0,
      totalMet: 0,
      membersWithGaps: 0,
      gapFreeMembers: 0,
      measurePriorityMap: {},
      weightedStarValue: 1.0,
    };
  }

  let totalApplicable = 0;
  let totalGaps = 0;
  let totalMet = 0;
  let membersWithGapsCount = 0;

  // Measure breakdown accumulators
  const measureStats = {};
  const allCodes = ['CBP', 'HBD_C7', 'EED', 'SPD', 'KED', 'BCS', 'FVA', 'AWV', 'MRP'];
  allCodes.forEach((code) => {
    measureStats[code] = { eligible: 0, compliant: 0, gaps: 0 };
  });

  for (const m of members) {
    const hasGap =
      m.hasCareGap === true ||
      m.HAS_CARE_GAP === 'Y' ||
      m.HAS_CARE_GAP === true ||
      (m.gapCount !== undefined && Number(m.gapCount) > 0) ||
      (m.STAR_MEASURES_GAPS !== undefined && Number(m.STAR_MEASURES_GAPS) > 0);

    if (hasGap) {
      membersWithGapsCount++;
    }

    if (m.measures && typeof m.measures === 'object') {
      for (const [code, res] of Object.entries(m.measures)) {
        if (measureStats[code]) {
          if (res === 'MET') {
            totalApplicable++;
            totalMet++;
            measureStats[code].eligible++;
            measureStats[code].compliant++;
          } else if (res === 'GAP') {
            totalApplicable++;
            totalGaps++;
            measureStats[code].eligible++;
            measureStats[code].gaps++;
          }
        }
      }
    } else {
      for (let i = 1; i <= 3; i++) {
        const critCode = (m[`CRITERIA_${i}_CODE`] || '').trim();
        const critRes = (m[`CRITERIA_${i}_RESULT`] || '').trim().toUpperCase();
        if (critCode && measureStats[critCode]) {
          if (critRes === 'MET') {
            totalApplicable++;
            totalMet++;
            measureStats[critCode].eligible++;
            measureStats[critCode].compliant++;
          } else if (critRes === 'GAP') {
            totalApplicable++;
            totalGaps++;
            measureStats[critCode].eligible++;
            measureStats[critCode].gaps++;
          }
        }
      }
    }
  }

  // Find max gaps in active plan measures for normalization
  const maxGapsInPlan = Math.max(
    ...Object.values(measureStats).map((s) => s.gaps),
    1
  );

  // Compute Priority Engine metrics for each assigned measure
  const measurePriorityMap = {};
  let totalWeightedStars = 0.0;
  let totalWeights = 0.0;

  for (const code of allCodes) {
    const stats = measureStats[code];
    if (stats.eligible > 0) {
      const priorityInfo = evaluateMeasurePriority(stats.eligible, stats.compliant, code, maxGapsInPlan);
      measurePriorityMap[code] = priorityInfo;

      const weight = priorityInfo.cmsWeight;
      totalWeightedStars += priorityInfo.currentStar * weight;
      totalWeights += weight;
    }
  }

  let starPct = 0;
  if (totalApplicable > 0) {
    starPct = Math.round((totalMet / totalApplicable) * 1000) / 10;
  }

  starPct = Math.max(0, Math.min(100, starPct));
  const starValue = totalApplicable > 0
    ? Math.round((1.0 + (starPct / 100) * 4.0) * 10) / 10
    : 1.0;

  const weightedStarValue = totalWeights > 0
    ? Math.round((totalWeightedStars / totalWeights) * 10) / 10
    : starValue;

  const gapFreeMembers = members.length - membersWithGapsCount;

  return {
    starPct,
    starValue,
    weightedStarValue,
    totalEvaluatedMeasures: totalApplicable,
    totalGaps,
    totalMet,
    membersWithGaps: membersWithGapsCount,
    gapFreeMembers,
    measurePriorityMap,
  };
}

/**
 * Computes the individual patient Priority Score based on the CareImpact Priority Engine.
 * 
 * Formula:
 * If patient has 0 gaps -> Priority = 0 (Lowest, Gap-Free)
 * If patient has open gaps -> Priority is derived from the measure priority scores of their specific open gaps.
 * A patient with a gap in a 3x Triple-Weight measure (e.g. CBP) or a measure near next-Star cutpoint receives higher priority.
 */
export function computePriority(patientRow = {}, planMeasurePriorityMap = {}) {
  if (!patientRow) return 0;

  const hasGap =
    patientRow.hasCareGap === true ||
    patientRow.HAS_CARE_GAP === 'Y' ||
    patientRow.HAS_CARE_GAP === true ||
    (patientRow.gapCount !== undefined && Number(patientRow.gapCount) > 0);

  if (!hasGap) return 0;

  let patientScore = 0;
  let gapCount = 0;

  // 1. Check normalized measures dictionary
  if (patientRow.measures && typeof patientRow.measures === 'object') {
    for (const [code, res] of Object.entries(patientRow.measures)) {
      if (res === 'GAP') {
        gapCount++;
        const measurePrio = planMeasurePriorityMap[code]?.priorityScore || 50;
        const weight = CLINICAL_MEASURE_CATALOG[code]?.cmsWeight || 1;
        patientScore += measurePrio * (weight >= 3 ? 1.3 : 1.0);
      }
    }
  } else {
    // 2. Check CRITERIA_1..3_RESULT
    for (let i = 1; i <= 3; i++) {
      const critCode = (patientRow[`CRITERIA_${i}_CODE`] || '').trim();
      const critRes = (patientRow[`CRITERIA_${i}_RESULT`] || '').trim().toUpperCase();
      if (critRes === 'GAP') {
        gapCount++;
        const measurePrio = planMeasurePriorityMap[critCode]?.priorityScore || 50;
        const weight = CLINICAL_MEASURE_CATALOG[critCode]?.cmsWeight || 1;
        patientScore += measurePrio * (weight >= 3 ? 1.3 : 1.0);
      }
    }
  }

  if (gapCount === 0) return 0;

  // Average score across open gaps, bounded 1–100
  const finalScore = Math.min(100, Math.max(1, Math.round(patientScore / gapCount)));
  return finalScore;
}

/**
 * Returns performance classification metadata based on Star percentage.
 */
export function getPerformanceStatus(starPct = 0) {
  if (starPct >= 80) {
    return {
      status: 'high_performing',
      label: 'High Performing (4–5★)',
      badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      textClass: 'text-emerald-400',
      bgClass: 'bg-emerald-950/40 border-emerald-800/40',
      barColor: 'from-emerald-500 to-teal-500',
      icon: 'CheckCircle2',
    };
  }
  if (starPct >= 60) {
    return {
      status: 'moderate',
      label: 'Moderate Performance (3★)',
      badgeClass: 'bg-amber-950 text-amber-300 border-amber-800',
      textClass: 'text-amber-400',
      bgClass: 'bg-amber-950/40 border-amber-800/40',
      barColor: 'from-amber-500 to-yellow-500',
      icon: 'AlertTriangle',
    };
  }
  return {
    status: 'at_risk',
    label: 'At Risk (1–2★)',
    badgeClass: 'bg-rose-950 text-rose-300 border-rose-800',
    textClass: 'text-rose-400',
    bgClass: 'bg-rose-950/40 border-rose-800/40',
    barColor: 'from-rose-500 to-red-600',
    icon: 'AlertOctagon',
  };
}
