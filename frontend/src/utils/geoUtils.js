/**
 * @file geoUtils.js
 * @description Geocoding mapping and clustering utilities for Massachusetts ZIP codes.
 */

// Massachusetts ZIP code to City and Lat/Lng coordinate dictionary
export const MA_ZIP_COORDINATES = {
  '02170': { city: 'Quincy', lat: 42.2529, lng: -71.0023 },
  '01852': { city: 'Lowell', lat: 42.6334, lng: -71.3162 },
  '01907': { city: 'Swampscott', lat: 42.4726, lng: -70.9189 },
  '01730': { city: 'Bedford', lat: 42.4907, lng: -71.2760 },
  '02718': { city: 'East Freetown', lat: 41.7765, lng: -70.9984 },
  '01535': { city: 'North Brookfield', lat: 42.2709, lng: -72.0837 },
  '02155': { city: 'Medford', lat: 42.4184, lng: -71.1062 },
  '02301': { city: 'Brockton', lat: 42.0834, lng: -71.0184 },
  '02066': { city: 'Scituate', lat: 42.1998, lng: -70.7259 },
  '01960': { city: 'Peabody', lat: 42.5279, lng: -70.9287 },
  '01752': { city: 'Marlborough', lat: 42.3459, lng: -71.5523 },
  '01801': { city: 'Woburn', lat: 42.4793, lng: -71.1523 },
  '02472': { city: 'Watertown', lat: 42.3709, lng: -71.1828 },
  '02481': { city: 'Wellesley Hills', lat: 42.3087, lng: -71.2676 },
  '01420': { city: 'Fitchburg', lat: 42.5834, lng: -71.8023 },
  '01570': { city: 'Webster', lat: 42.0501, lng: -71.8801 },
  '01890': { city: 'Winchester', lat: 42.4523, lng: -71.1370 },
  '01906': { city: 'Saugus', lat: 42.4637, lng: -71.0117 },
  '02116': { city: 'Boston (Back Bay)', lat: 42.3503, lng: -71.0772 },
  '02109': { city: 'Boston (Downtown)', lat: 42.3584, lng: -71.0598 },
  '02110': { city: 'Boston (Financial District)', lat: 42.3551, lng: -71.0544 },
  '02111': { city: 'Boston (Chinatown)', lat: 42.3512, lng: -71.0610 },
  '02113': { city: 'Boston (North End)', lat: 42.3647, lng: -71.0542 },
  '02114': { city: 'Boston (Beacon Hill)', lat: 42.3615, lng: -71.0664 },
  '02124': { city: 'Dorchester', lat: 42.2848, lng: -71.0700 },
  '02125': { city: 'Dorchester (North)', lat: 42.3148, lng: -71.0564 },
  '02126': { city: 'Mattapan', lat: 42.2773, lng: -71.0928 },
  '02129': { city: 'Charlestown', lat: 42.3782, lng: -71.0602 },
  '02131': { city: 'Roslindale', lat: 42.2831, lng: -71.1278 },
  '02139': { city: 'Cambridge', lat: 42.3653, lng: -71.1054 },
  '02141': { city: 'East Cambridge', lat: 42.3700, lng: -71.0850 },
  '02145': { city: 'Somerville', lat: 42.3876, lng: -71.0995 },
  '02149': { city: 'Everett', lat: 42.4084, lng: -71.0537 },
  '02186': { city: 'Milton', lat: 42.2495, lng: -71.0662 },
  '02191': { city: 'North Weymouth', lat: 42.2343, lng: -70.9328 },
  '02351': { city: 'Abington', lat: 42.1048, lng: -70.9453 },
  '02457': { city: 'Needham', lat: 42.2809, lng: -71.2378 },
  '02460': { city: 'Newtonville', lat: 42.3512, lng: -71.2064 },
  '02461': { city: 'Newton Highlands', lat: 42.3218, lng: -71.2081 },
  '02462': { city: 'Newton Lower Falls', lat: 42.3248, lng: -71.2548 },
  '02474': { city: 'Arlington', lat: 42.4154, lng: -71.1564 },
  '02478': { city: 'Belmont', lat: 42.3959, lng: -71.1787 },
  '02492': { city: 'Needham Heights', lat: 42.2965, lng: -71.2356 },
  '02668': { city: 'West Barnstable', lat: 41.6965, lng: -70.3667 },
  '02720': { city: 'Fall River', lat: 41.7015, lng: -71.1550 },
  '02723': { city: 'Fall River (North)', lat: 41.7150, lng: -71.1400 },
  '02743': { city: 'Acushnet', lat: 41.6812, lng: -70.9084 },
  '02767': { city: 'Raynham', lat: 41.9334, lng: -71.0453 },
  '01007': { city: 'Belchertown', lat: 42.2770, lng: -72.4342 },
  '01013': { city: 'Chicopee', lat: 42.1487, lng: -72.6079 },
  '01022': { city: 'Westover', lat: 42.1965, lng: -72.5484 },
  '01033': { city: 'Granby', lat: 42.2570, lng: -72.5187 },
  '01040': { city: 'Holyoke', lat: 42.2043, lng: -72.6162 },
  '01105': { city: 'Springfield', lat: 42.1015, lng: -72.5898 },
  '01240': { city: 'Lenox', lat: 42.3570, lng: -73.2848 },
  '01267': { city: 'Williamstown', lat: 42.7120, lng: -73.2037 },
  '01440': { city: 'Gardner', lat: 42.5751, lng: -71.9981 },
  '01464': { city: 'Shirley', lat: 42.5434, lng: -71.6498 },
  '01701': { city: 'Framingham', lat: 42.2793, lng: -71.4162 },
  '01754': { city: 'Maynard', lat: 42.4334, lng: -71.4517 },
  '01810': { city: 'Andover', lat: 42.6584, lng: -71.1370 },
  '01850': { city: 'Lowell (Centraville)', lat: 42.6450, lng: -71.3050 },
  '01905': { city: 'Lynn', lat: 42.4668, lng: -70.9495 },
  '01915': { city: 'Beverly', lat: 42.5584, lng: -70.8800 },
  '01940': { city: 'Lynnfield', lat: 42.5284, lng: -71.0298 },
  '01945': { city: 'Marblehead', lat: 42.5034, lng: -70.8578 },
  '01951': { city: 'Newbury', lat: 42.7751, lng: -70.8653 },
  '02035': { city: 'Foxborough', lat: 42.0654, lng: -71.2495 },
  '02045': { city: 'Hull', lat: 42.3023, lng: -70.9084 },
  '02050': { city: 'Marshfield', lat: 42.0918, lng: -70.7056 },
  '02051': { city: 'Marshfield Hills', lat: 42.1334, lng: -70.7300 },
  '02062': { city: 'Norwood', lat: 42.1951, lng: -71.1962 },
  '00000': { city: 'Massachusetts (Statewide Cohort)', lat: 42.4072, lng: -71.3824 },
};

/**
 * Aggregates member records into geographic map clusters based on ZIP code.
 *
 * @param {Array<Object>} members - Array of member records
 * @returns {Array<Object>} Plotted geographic points with member counts and gap rates
 */
export function buildGeoPoints(members = []) {
  const zipMap = new Map();

  for (const m of members) {
    const rawZip = (m.zip || '00000').trim();
    const zip = MA_ZIP_COORDINATES[rawZip] ? rawZip : '00000';
    const coordInfo = MA_ZIP_COORDINATES[zip] || MA_ZIP_COORDINATES['00000'];

    if (!zipMap.has(zip)) {
      zipMap.set(zip, {
        zip,
        city: coordInfo.city,
        state: m.state || 'Massachusetts',
        lat: coordInfo.lat,
        lng: coordInfo.lng,
        totalMembers: 0,
        completedMembers: 0,
        pendingMembers: 0,
        gapCountsByMeasure: {},
        membersList: [],
      });
    }

    const cluster = zipMap.get(zip);
    cluster.totalMembers++;
    if (m.hasCareGap) {
      cluster.pendingMembers++;
    } else {
      cluster.completedMembers++;
    }
    cluster.membersList.push(m);

    // Track specific measure gaps in this location
    if (m.measures) {
      for (const [code, res] of Object.entries(m.measures)) {
        if (res === 'GAP') {
          cluster.gapCountsByMeasure[code] = (cluster.gapCountsByMeasure[code] || 0) + 1;
        }
      }
    }
  }

  const points = Array.from(zipMap.values()).map((pt) => {
    const compliancePct =
      pt.totalMembers > 0
        ? Math.round((pt.completedMembers / pt.totalMembers) * 100)
        : 100;

    // Top open gaps in this location
    const topGaps = Object.entries(pt.gapCountsByMeasure)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([code, cnt]) => `${code} (${cnt})`);

    return {
      ...pt,
      compliancePct,
      topGapsString: topGaps.length > 0 ? topGaps.join(', ') : 'None (Compliant)',
    };
  });

  // Sort by total members descending
  points.sort((a, b) => b.totalMembers - a.totalMembers);
  return points;
}
