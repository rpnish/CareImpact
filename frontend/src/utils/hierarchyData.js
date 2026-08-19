/**
 * @file hierarchyData.js
 * @description Loads, parses, and structures newmembers.csv into the three-level hierarchy:
 * Company -> Plans -> Members. Integrates CareImpact Star & Priority calculations.
 */

import Papa from 'papaparse';
import {
  computeStarRating,
  computePriority,
  getPerformanceStatus,
  CLINICAL_MEASURE_CATALOG,
  PLAN_DISEASE_AFFILIATIONS,
} from './metricsEngine';

const MEASURE_CODES = ['CBP', 'HBD_C7', 'EED', 'SPD', 'KED', 'BCS', 'FVA', 'AWV', 'MRP'];

/**
 * Calculates age in years from an ISO birthdate string.
 */
function calculateAge(birthdateStr) {
  if (!birthdateStr) return 'N/A';
  const birthDate = new Date(birthdateStr);
  if (Number.isNaN(birthDate.getTime())) return 'N/A';
  const today = new Date('2026-08-19'); // Consistent measurement baseline
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Extracts normalized clinical measure statuses (MET / GAP / N/A) from a row.
 */
function extractMeasuresFromRow(row) {
  const measures = {};

  for (const code of MEASURE_CODES) {
    // 1. Direct column lookup if exists
    if (row[code] && typeof row[code] === 'string' && row[code].trim()) {
      const val = row[code].trim().toUpperCase();
      measures[code] = val === 'MET' || val === 'GAP' ? val : 'N/A';
      continue;
    }

    // 2. Lookup in CRITERIA_1..3 columns
    let match = 'N/A';
    for (let i = 1; i <= 3; i++) {
      const critCode = (row[`CRITERIA_${i}_CODE`] || '').trim();
      const critResult = (row[`CRITERIA_${i}_RESULT`] || '').trim().toUpperCase();
      if (critCode === code) {
        match = critResult === 'MET' || critResult === 'GAP' ? critResult : 'N/A';
        break;
      }
    }

    measures[code] = match;
  }

  return measures;
}

/**
 * Normalizes a raw CSV row into a clean patient object.
 */
export function normalizePatientRow(row, index = 0) {
  const measures = extractMeasuresFromRow(row);
  const patientId = (row.PATIENT_ID || `PAT-${index + 1}`).trim();
  const memberId = (row.MEMBER_ID || patientId).trim();
  const firstName = (row.FIRST_NAME || 'Member').trim();
  const lastName = (row.LAST_NAME || `${index + 1}`).trim();
  const company = (row.INSURANCE_COMPANY || 'Unassigned Company').trim();
  const planName = (row.PLAN_NAME || company).trim();
  const planId = (row.PLAN_ID || 'PLN-DEFAULT').trim();
  const planOwnership = (row.PLAN_OWNERSHIP || 'PRIVATE').trim().toUpperCase();
  const birthdate = (row.BIRTHDATE || '').trim();
  const age = calculateAge(birthdate);
  const gender = (row.GENDER || 'U').trim().toUpperCase();
  const state = (row.STATE || 'MA').trim();
  const zip = (row.ZIP || '').trim();
  const hasCareGap = (row.HAS_CARE_GAP || '').trim().toUpperCase() === 'Y';

  // Count applicable and gap counts from extracted measures or fallback columns
  let applicableCount = 0;
  let gapCount = 0;
  let metCount = 0;

  for (const status of Object.values(measures)) {
    if (status === 'MET') {
      applicableCount++;
      metCount++;
    } else if (status === 'GAP') {
      applicableCount++;
      gapCount++;
    }
  }

  if (applicableCount === 0 && row.STAR_MEASURES_APPLICABLE) {
    applicableCount = Number(row.STAR_MEASURES_APPLICABLE) || 0;
    gapCount = Number(row.STAR_MEASURES_GAPS) || (hasCareGap ? 1 : 0);
    metCount = Math.max(0, applicableCount - gapCount);
  }

  return {
    raw: row,
    id: patientId,
    patientId,
    memberId,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    birthdate,
    age,
    gender,
    state,
    zip,
    company,
    planName,
    planId,
    planOwnership,
    startDate: (row.PLAN_START_DATE || '').trim(),
    endDate: (row.PLAN_END_DATE || '').trim(),
    measures,
    applicableCount,
    gapCount,
    metCount,
    hasCareGap: hasCareGap || gapCount > 0,
    priority: 0, // Computed dynamically in buildHierarchyTree
  };
}

/**
 * Builds the 3-level hierarchy (Company -> Plan -> Members) and assigns real CareImpact priority scores.
 */
export function buildHierarchyTree(rawRows = []) {
  const normalizedMembers = rawRows.map((r, i) => normalizePatientRow(r, i));

  const companiesMap = new Map();

  for (const member of normalizedMembers) {
    const compName = member.company;
    const planName = member.planName;

    if (!companiesMap.has(compName)) {
      companiesMap.set(compName, {
        companyName: compName,
        plansMap: new Map(),
        allMembers: [],
        ownershipTypes: new Set(),
      });
    }

    const companyNode = companiesMap.get(compName);
    companyNode.allMembers.push(member);
    if (member.planOwnership) {
      companyNode.ownershipTypes.add(member.planOwnership);
    }

    if (!companyNode.plansMap.has(planName)) {
      companyNode.plansMap.set(planName, {
        planName,
        companyName: compName,
        planId: member.planId,
        ownership: member.planOwnership,
        members: [],
      });
    }

    companyNode.plansMap.get(planName).members.push(member);
  }

  // Compute metrics and rollups at Plan and Company levels
  const companiesList = [];
  let totalNetworkMembers = 0;
  let totalNetworkPlans = 0;

  for (const [compName, compData] of companiesMap.entries()) {
    const plansList = [];
    const diseaseAffiliation = PLAN_DISEASE_AFFILIATIONS[compName] || {
      company: compName,
      targetPopulation: 'Enrolled Members',
      diseases: [],
    };

    for (const [pName, planData] of compData.plansMap.entries()) {
      const planMembers = planData.members;
      const starMetrics = computeStarRating(planMembers, compName);
      const performance = getPerformanceStatus(starMetrics.starPct);

      // Now compute the real CareImpact Priority score for each patient in this plan!
      for (const m of planMembers) {
        m.priority = computePriority(m, starMetrics.measurePriorityMap);
      }

      // Measure breakdown per plan
      const measureBreakdown = {};
      for (const code of MEASURE_CODES) {
        let met = 0;
        let gap = 0;
        let na = 0;
        for (const m of planMembers) {
          const res = m.measures[code] || 'N/A';
          if (res === 'MET') met++;
          else if (res === 'GAP') gap++;
          else na++;
        }
        measureBreakdown[code] = {
          code,
          info: CLINICAL_MEASURE_CATALOG[code],
          met,
          gap,
          na,
          totalApplicable: met + gap,
          compliancePct: met + gap > 0 ? Math.round((met / (met + gap)) * 100) : 0,
          priorityData: starMetrics.measurePriorityMap[code] || null,
        };
      }

      const planObj = {
        planName: pName,
        companyName: compName,
        planId: planData.planId,
        ownership: planData.ownership,
        members: planMembers,
        memberCount: planMembers.length,
        starMetrics,
        starPct: starMetrics.starPct,
        starValue: starMetrics.starValue,
        weightedStarValue: starMetrics.weightedStarValue,
        performance,
        gapCount: starMetrics.totalGaps,
        metCount: starMetrics.totalMet,
        membersWithGaps: starMetrics.membersWithGaps,
        gapFreeMembers: starMetrics.gapFreeMembers,
        measureBreakdown,
        diseaseAffiliation,
      };

      plansList.push(planObj);
    }

    plansList.sort((a, b) => b.memberCount - a.memberCount);

    const compMembers = compData.allMembers;
    const companyStarMetrics = computeStarRating(compMembers, compName);
    const companyPerformance = getPerformanceStatus(companyStarMetrics.starPct);

    // Compute company-level priority for each member
    for (const m of compMembers) {
      m.priority = computePriority(m, companyStarMetrics.measurePriorityMap);
    }

    const companyObj = {
      companyName: compName,
      plans: plansList,
      plansCount: plansList.length,
      allMembers: compMembers,
      totalMembers: compMembers.length,
      starMetrics: companyStarMetrics,
      starPct: companyStarMetrics.starPct,
      starValue: companyStarMetrics.starValue,
      weightedStarValue: companyStarMetrics.weightedStarValue,
      performance: companyPerformance,
      gapCount: companyStarMetrics.totalGaps,
      metCount: companyStarMetrics.totalMet,
      membersWithGaps: companyStarMetrics.membersWithGaps,
      gapFreeMembers: companyStarMetrics.gapFreeMembers,
      ownershipTypes: Array.from(compData.ownershipTypes),
      diseaseAffiliation,
    };

    companiesList.push(companyObj);
    totalNetworkMembers += compMembers.length;
    totalNetworkPlans += plansList.length;
  }

  companiesList.sort((a, b) => b.totalMembers - a.totalMembers);

  return {
    companies: companiesList,
    totalCompanies: companiesList.length,
    totalPlans: totalNetworkPlans,
    totalMembers: totalNetworkMembers,
    allMembers: normalizedMembers,
  };
}

/**
 * Parses CSV text and constructs hierarchy.
 */
export function parseHierarchyCsvText(csvText) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            throw new Error('CSV file is empty or could not be parsed.');
          }
          const hierarchy = buildHierarchyTree(results.data);
          resolve(hierarchy);
        } catch (err) {
          reject(err);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

/**
 * Loads and parses newmembers.csv directly from the public folder or fallback endpoint.
 */
export async function loadHierarchyFromCsv(url = '/newmembers.csv') {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }
    const csvText = await response.text();
    return parseHierarchyCsvText(csvText);
  } catch (err) {
    console.error('Error fetching CSV from public directory:', err);
    throw err;
  }
}
