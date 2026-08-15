import React, { useState, useMemo } from 'react';

const DATA = [{"member_id": "01a006ce-6457-50c2-8e0a-fb58fc310a86", "member_name": "Rogelio Pacocha", "age": 56, "gender": "M", "city": "West Springfield", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": true, "has_hypertension": true, "diabetic_eye_exam_status": "compliant", "last_exam_date": "2024-11-16", "blood_pressure_control_status": "compliant", "last_bp_reading": "102/77", "diabetes_med_adherence_status": "compliant", "adherence_pct": 100.0, "flu_vaccination_status": "gap", "last_flu_shot_date": "2025-04-15", "priorityScore": 0},
{"member_id": "03a7cc66-36c5-356c-419f-93bfbd7b558d", "member_name": "Dominic Parker", "age": 84, "gender": "M", "city": "Oxford", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "gap", "last_flu_shot_date": "2016-06-25", "priorityScore": 0},
{"member_id": "09c92ce0-6ff1-7234-956d-33795ad6648c", "member_name": "Lyndia Fisher", "age": 6, "gender": "F", "city": "Norton", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2026-05-29", "priorityScore": 0},
{"member_id": "1e7909f8-39b2-3c7e-1fda-a6c3256dc061", "member_name": "Edmond Herzog", "age": 62, "gender": "M", "city": "Lynnfield", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2026-02-18", "priorityScore": 0},
{"member_id": "21060120-8398-1940-3dc7-1d7f56bb2674", "member_name": "Santana Kris", "age": 23, "gender": "F", "city": "Chicopee", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2026-03-09", "priorityScore": 0},
{"member_id": "2eb14889-46f2-06de-4f6e-fea5634e0d85", "member_name": "Chasidy Grant", "age": 83, "gender": "F", "city": "Arlington", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2026-04-26", "priorityScore": 0},
{"member_id": "33d283d8-d724-4c5d-9eb2-aab318712e12", "member_name": "Erasmo Russel", "age": 73, "gender": "M", "city": "Dighton", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2025-12-09", "priorityScore": 0},
{"member_id": "38389261-1bb1-5848-dbed-abbae41b2b6a", "member_name": "Chanelle Sanford", "age": 20, "gender": "F", "city": "Brockton", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2026-05-13", "priorityScore": 0},
{"member_id": "3ab40d52-44be-ae07-2177-2875cc65f5a8", "member_name": "Harvey Ernser", "age": 31, "gender": "M", "city": "Northampton", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2025-10-06", "priorityScore": 0},
{"member_id": "4d5bd8b4-8ee1-c357-dd1d-6bca1c275f56", "member_name": "Shirl Mohr", "age": 66, "gender": "F", "city": "Lowell", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": true, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "compliant", "last_bp_reading": "113/73", "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2026-01-12", "priorityScore": 0},
{"member_id": "53e4891a-9108-67ef-d973-3b6a98404249", "member_name": "Georgiann Dickinson", "age": 75, "gender": "F", "city": "Lowell", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": true, "has_hypertension": true, "diabetic_eye_exam_status": "compliant", "last_exam_date": "2026-02-28", "blood_pressure_control_status": "compliant", "last_bp_reading": "121/89", "diabetes_med_adherence_status": "compliant", "adherence_pct": 100.0, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2026-02-11", "priorityScore": 0},
{"member_id": "5a1b2463-6dbf-ff69-4ab9-fbc24841b9fd", "member_name": "Ariadna Fernández", "age": 20, "gender": "F", "city": "Revere", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "gap", "last_flu_shot_date": "2007-10-07", "priorityScore": 0},
{"member_id": "688c8453-ba6f-7dec-03c3-eaa27d6df1a4", "member_name": "Gary Botsford", "age": 67, "gender": "M", "city": "Quincy", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": true, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "gap", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "gap", "last_flu_shot_date": "2018-09-21", "priorityScore": 0},
{"member_id": "7ad140ab-bfae-c3ae-20a3-2244b1c4d0e2", "member_name": "Guadalupe Valencia", "age": 72, "gender": "F", "city": "Boston", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": true, "has_hypertension": true, "diabetic_eye_exam_status": "gap", "last_exam_date": "2024-01-24", "blood_pressure_control_status": "gap", "last_bp_reading": null, "diabetes_med_adherence_status": "compliant", "adherence_pct": 100.0, "flu_vaccination_status": "gap", "last_flu_shot_date": "2023-11-27", "priorityScore": 0},
{"member_id": "885c1eeb-1b4c-8a3a-bfc7-a68897e470a6", "member_name": "Mohammad Kshlerin", "age": 70, "gender": "M", "city": "Montague", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2026-05-05", "priorityScore": 0},
{"member_id": "8d7f6a31-31ba-da9c-2b57-03ee0f7577a0", "member_name": "Eloisa Sanabria", "age": 72, "gender": "F", "city": "Boston", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": true, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "gap", "last_bp_reading": "122/93", "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2026-05-04", "priorityScore": 0},
{"member_id": "9277390b-8a92-52e1-4d99-bb4849bac775", "member_name": "Ursula Doyle", "age": 68, "gender": "F", "city": "Arlington", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2025-12-18", "priorityScore": 0},
{"member_id": "93904045-6509-c7c6-9b28-aff82a8e7181", "member_name": "Damion Green", "age": 67, "gender": "M", "city": "Quincy", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2026-05-22", "priorityScore": 0},
{"member_id": "9a57c612-581f-1c85-d505-c6c44e983d32", "member_name": "Marleen Wisoky", "age": 38, "gender": "F", "city": "Middleborough", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "gap", "last_flu_shot_date": "2025-06-26", "priorityScore": 0},
{"member_id": "a37f52ec-31c4-a8da-19ba-debcbe745096", "member_name": "Todd Schuster", "age": 84, "gender": "M", "city": "Oxford", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2025-08-16", "priorityScore": 0},
{"member_id": "a393b12a-75b9-22ff-2a46-d564c2dff4f4", "member_name": "Joaquín Camarillo", "age": 75, "gender": "M", "city": "Milton", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2026-07-10", "priorityScore": 0},
{"member_id": "ab07c698-12cf-16d5-d125-354f3b85b899", "member_name": "Alfonso Ulloa", "age": 75, "gender": "M", "city": "Milton", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "gap", "last_flu_shot_date": "2019-05-31", "priorityScore": 0},
{"member_id": "ad41b3b5-b5a1-f136-af92-bc03052fba86", "member_name": "Lashonda McLaughlin", "age": 66, "gender": "F", "city": "Easthampton", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2026-01-05", "priorityScore": 0},
{"member_id": "c1b2ab2b-da66-32d5-1257-63d0f155fd8b", "member_name": "Rochel Senger", "age": 47, "gender": "F", "city": "Boston", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2025-10-18", "priorityScore": 0},
{"member_id": "d20a36fc-23ba-8462-bf39-864000fbf25f", "member_name": "Terry Glover", "age": 67, "gender": "M", "city": "Belmont", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": true, "has_hypertension": true, "diabetic_eye_exam_status": "compliant", "last_exam_date": "2026-06-26", "blood_pressure_control_status": "compliant", "last_bp_reading": "129/89", "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2026-03-19", "priorityScore": 0},
{"member_id": "d3bcf7cc-11ff-2e5c-2eb4-bd90a1aac20b", "member_name": "Humberto Reilly", "age": 37, "gender": "M", "city": "Lynn", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": true, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "compliant", "last_bp_reading": "117/74", "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2025-07-24", "priorityScore": 0},
{"member_id": "d9264059-a17f-517e-bc65-eb3df11c2e10", "member_name": "Walton Ward", "age": 4, "gender": "M", "city": "Quincy", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2026-01-11", "priorityScore": 0},
{"member_id": "e63ee044-44a6-784d-28a0-0d049d2449a5", "member_name": "Julio Calderón", "age": 67, "gender": "M", "city": "Worcester", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": true, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "compliant", "last_bp_reading": "111/74", "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2026-07-11", "priorityScore": 0},
{"member_id": "f238b3d3-c8f3-ef73-da73-8ddd4fd38bcb", "member_name": "Isiah Prohaska", "age": 43, "gender": "M", "city": "Bridgewater", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "gap", "last_flu_shot_date": "2025-05-20", "priorityScore": 0},
{"member_id": "f540af27-06ff-0981-5685-24c08ab33443", "member_name": "Gilbert Rempel", "age": 37, "gender": "M", "city": "Oak Bluffs", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "gap", "last_flu_shot_date": "2023-08-01", "priorityScore": 0},
{"member_id": "f9ba83f7-9940-16ae-0854-24bd34bf1843", "member_name": "Ashlee Tromp", "age": 54, "gender": "F", "city": "Barnstable", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2026-06-16", "priorityScore": 0},
{"member_id": "fc2d1fb9-862d-a60c-581a-519f5470d866", "member_name": "Eartha Kulas", "age": 50, "gender": "F", "city": "Wakefield", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": true, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "gap", "last_bp_reading": "135/110", "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2025-08-26", "priorityScore": 0},
{"member_id": "fe0bfc8f-4cb4-7f87-4b4d-7997cbe26516", "member_name": "Josh Schultz", "age": 72, "gender": "M", "city": "Lynn", "state": "Massachusetts", "insurance_company": "Medicare", "has_diabetes": false, "has_hypertension": false, "diabetic_eye_exam_status": "not_eligible", "last_exam_date": null, "blood_pressure_control_status": "not_eligible", "last_bp_reading": null, "diabetes_med_adherence_status": "not_eligible", "adherence_pct": null, "flu_vaccination_status": "compliant", "last_flu_shot_date": "2026-01-31", "priorityScore": 0}];

const COLUMNS = [
  { key: 'member_id', label: 'Member ID' },
  { key: 'member_name', label: 'Name' },
  { key: 'age', label: 'Age' },
  { key: 'gender', label: 'Gender' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'insurance_company', label: 'Insurance' },
  { key: 'has_diabetes', label: 'Diabetes' },
  { key: 'has_hypertension', label: 'Hypertension' },
  { key: 'diabetic_eye_exam_status', label: 'Eye Exam Status' },
  { key: 'last_exam_date', label: 'Last Exam Date' },
  { key: 'blood_pressure_control_status', label: 'BP Control Status' },
  { key: 'last_bp_reading', label: 'Last BP Reading' },
  { key: 'diabetes_med_adherence_status', label: 'Med Adherence Status' },
  { key: 'adherence_pct', label: 'Adherence %' },
  { key: 'flu_vaccination_status', label: 'Flu Vaccination Status' },
  { key: 'last_flu_shot_date', label: 'Last Flu Shot Date' },
  { key: 'priorityScore', label: 'Priority Score' },
];

function StatusBadge({ value }) {
  if (value === 'compliant') return <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, background: 'var(--bg-success)', color: 'var(--text-success)', whiteSpace: 'nowrap' }}>compliant</span>;
  if (value === 'gap') return <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, background: 'var(--bg-danger)', color: 'var(--text-danger)', whiteSpace: 'nowrap' }}>gap</span>;
  if (value === 'not_eligible') return <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, background: 'var(--surface-2)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>not_eligible</span>;
  return <span>—</span>;
}

function cell(row, key) {
  const val = row[key];
  if (key.endsWith('_status')) return <StatusBadge value={val} />;
  if (key === 'has_diabetes' || key === 'has_hypertension') return val ? 'Yes' : 'No';
  if (val === null || val === undefined || val === '') return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  return String(val);
}

export default function MembersTable() {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const filtered = useMemo(() => {
    let rows = DATA;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(r =>
        r.member_name.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.member_id.toLowerCase().includes(q)
      );
    }
    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        let av = a[sortKey], bv = b[sortKey];
        if (av === null || av === undefined) av = '';
        if (bv === null || bv === undefined) bv = '';
        if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
        av = String(av).toLowerCase(); bv = String(bv).toLowerCase();
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [search, sortKey, sortDir]);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>Medicare Members</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
            {filtered.length} of {DATA.length} members · all columns from members_wide.csv
          </p>
        </div>
        <input
          type="text"
          placeholder="Search name, city, or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '0.5px solid var(--border)', fontSize: 13, minWidth: 240 }}
        />
      </div>

      <div style={{ overflowX: 'auto', border: '0.5px solid var(--border)', borderRadius: 12 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-1)' }}>
              {COLUMNS.map(col => (
                <th key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      padding: '10px 12px', textAlign: 'left', fontWeight: 500,
                      cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
                      borderBottom: '0.5px solid var(--border)', color: 'var(--text-secondary)',
                    }}>
                  {col.label}
                  {sortKey === col.key && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={row.member_id} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--surface-1)' }}>
                {COLUMNS.map(col => (
                  <td key={col.key} style={{ padding: '10px 12px', whiteSpace: 'nowrap', borderBottom: '0.5px solid var(--border)' }}>
                    {cell(row, col.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
