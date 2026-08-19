import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadHierarchyFromCsv } from '../utils/hierarchyData';
import { computeStarRating, computePriority, CLINICAL_MEASURE_CATALOG } from '../utils/metricsEngine';

const MemberStoreContext = createContext(null);

const STORAGE_KEY_UPDATES = 'careimpact_member_updates_v1';
const STORAGE_KEY_NEW_MEMBERS = 'careimpact_new_members_v1';
const STORAGE_KEY_DELETED = 'careimpact_deleted_members_v1';

export function MemberStoreProvider({ children }) {
  const [hierarchy, setHierarchy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Local storage maps for member updates, newly created members, and deleted member IDs
  const [memberUpdates, setMemberUpdates] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UPDATES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [customMembers, setCustomMembers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NEW_MEMBERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedMemberIds, setDeletedMemberIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DELETED);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadHierarchyFromCsv('/newmembers.csv');
      setHierarchy(data);
    } catch (err) {
      console.error('Failed to load hierarchy data:', err);
      setError(err.message || 'Failed to load member records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Persist updates to localStorage
  const saveMemberUpdates = (updatesMap) => {
    setMemberUpdates(updatesMap);
    try {
      localStorage.setItem(STORAGE_KEY_UPDATES, JSON.stringify(updatesMap));
    } catch (e) {
      console.error('Error saving member updates:', e);
    }
  };

  const saveCustomMembers = (membersList) => {
    setCustomMembers(membersList);
    try {
      localStorage.setItem(STORAGE_KEY_NEW_MEMBERS, JSON.stringify(membersList));
    } catch (e) {
      console.error('Error saving custom members:', e);
    }
  };

  const saveDeletedMembers = (deletedList) => {
    setDeletedMemberIds(deletedList);
    try {
      localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(deletedList));
    } catch (e) {
      console.error('Error saving deleted members:', e);
    }
  };

  // 1. Update an existing member (e.g. closing a care gap with document proof)
  const updateMemberStatus = (patientId, measureCode, newStatus, clinicalValue, proofDocument = null) => {
    const existingUpdate = memberUpdates[patientId] || {
      measures: {},
      proofDocuments: [],
      clinicalValues: {},
    };

    const updatedMeasures = {
      ...existingUpdate.measures,
      [measureCode]: newStatus,
    };

    const updatedValues = {
      ...existingUpdate.clinicalValues,
      [measureCode]: clinicalValue,
    };

    let updatedDocs = [...(existingUpdate.proofDocuments || [])];
    if (proofDocument) {
      updatedDocs.unshift({
        id: `DOC-${Date.now()}`,
        measureCode,
        measureName: CLINICAL_MEASURE_CATALOG[measureCode]?.name || measureCode,
        status: newStatus,
        uploadedAt: new Date().toISOString(),
        ...proofDocument,
      });
    }

    const newUpdates = {
      ...memberUpdates,
      [patientId]: {
        measures: updatedMeasures,
        clinicalValues: updatedValues,
        proofDocuments: updatedDocs,
        lastUpdatedAt: new Date().toISOString(),
      },
    };

    saveMemberUpdates(newUpdates);
  };

  // 2. Add a newly created member
  const addNewMember = (newMemberData) => {
    const newId = `PAT-${Date.now()}`;
    const newMember = {
      id: newId,
      patientId: newId,
      memberId: `MBR-${Math.floor(100000 + Math.random() * 900000)}`,
      firstName: newMemberData.firstName,
      lastName: newMemberData.lastName,
      fullName: `${newMemberData.firstName} ${newMemberData.lastName}`,
      birthdate: newMemberData.birthdate || '1960-01-01',
      age: Number(newMemberData.age) || 65,
      gender: newMemberData.gender || 'F',
      state: 'MA',
      zip: newMemberData.zip || '02108',
      company: newMemberData.company || 'Medicare',
      planName: newMemberData.planName || newMemberData.company || 'Medicare',
      planId: `PLN-${(newMemberData.company || 'MED').slice(0, 3).toUpperCase()}-01`,
      planOwnership: newMemberData.planOwnership || 'PRIVATE',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-12-31',
      measures: newMemberData.measures || {},
      proofDocuments: newMemberData.proofDocuments || [],
      priority: 0,
    };

    // Calculate initial gap status
    let gapCount = 0;
    let metCount = 0;
    let applicableCount = 0;
    for (const res of Object.values(newMember.measures)) {
      if (res === 'MET') {
        metCount++;
        applicableCount++;
      } else if (res === 'GAP') {
        gapCount++;
        applicableCount++;
      }
    }
    newMember.gapCount = gapCount;
    newMember.metCount = metCount;
    newMember.applicableCount = applicableCount;
    newMember.hasCareGap = gapCount > 0;

    const updatedList = [newMember, ...customMembers];
    saveCustomMembers(updatedList);
    return newMember;
  };

  // 3. Delete a member record
  const deleteMember = (patientId) => {
    if (!patientId) return;

    // Add to deleted set
    if (!deletedMemberIds.includes(patientId)) {
      const updatedDeleted = [...deletedMemberIds, patientId];
      saveDeletedMembers(updatedDeleted);
    }

    // Remove from custom added members if present
    const updatedCustom = customMembers.filter(
      (m) => m.id !== patientId && m.patientId !== patientId
    );
    if (updatedCustom.length !== customMembers.length) {
      saveCustomMembers(updatedCustom);
    }

    // Remove any updates
    if (memberUpdates[patientId]) {
      const newUpdates = { ...memberUpdates };
      delete newUpdates[patientId];
      saveMemberUpdates(newUpdates);
    }
  };

  // 4. Resolve a complete member record by merging base CSV + local updates
  const getMemberById = (id) => {
    if (!id || deletedMemberIds.includes(id)) return null;

    // Check custom newly added members first
    const customMatch = customMembers.find(
      (m) => (m.id === id || m.patientId === id) && !deletedMemberIds.includes(m.patientId)
    );
    let base = customMatch || null;

    if (!base && hierarchy) {
      base = hierarchy.allMembers.find(
        (m) =>
          (m.id === id || m.patientId === id || m.memberId === id) &&
          !deletedMemberIds.includes(m.patientId) &&
          !deletedMemberIds.includes(m.id)
      );
    }

    if (!base) return null;

    // Apply any local status updates or proof documents
    const updates = memberUpdates[base.patientId] || memberUpdates[base.id];
    if (!updates) {
      return {
        ...base,
        proofDocuments: base.proofDocuments || [],
      };
    }

    const mergedMeasures = {
      ...base.measures,
      ...(updates.measures || {}),
    };

    let gapCount = 0;
    let metCount = 0;
    let applicableCount = 0;
    for (const res of Object.values(mergedMeasures)) {
      if (res === 'MET') {
        metCount++;
        applicableCount++;
      } else if (res === 'GAP') {
        gapCount++;
        applicableCount++;
      }
    }

    const mergedMember = {
      ...base,
      measures: mergedMeasures,
      clinicalValues: {
        ...(base.clinicalValues || {}),
        ...(updates.clinicalValues || {}),
      },
      proofDocuments: [
        ...(updates.proofDocuments || []),
        ...(base.proofDocuments || []),
      ],
      gapCount,
      metCount,
      applicableCount,
      hasCareGap: gapCount > 0,
    };

    // Recompute Priority score
    mergedMember.priority = computePriority(mergedMember);

    return mergedMember;
  };

  return (
    <MemberStoreContext.Provider
      value={{
        hierarchy,
        loading,
        error,
        refreshData: loadData,
        updateMemberStatus,
        addNewMember,
        deleteMember,
        getMemberById,
        memberUpdates,
        customMembers,
        deletedMemberIds,
      }}
    >
      {children}
    </MemberStoreContext.Provider>
  );
}

export function useMemberStore() {
  const context = useContext(MemberStoreContext);
  if (!context) {
    throw new Error('useMemberStore must be used within a MemberStoreProvider');
  }
  return context;
}
