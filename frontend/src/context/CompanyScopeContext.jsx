import React, { createContext, useContext, useState, useEffect } from 'react';

const CompanyScopeContext = createContext(null);

export function CompanyScopeProvider({ children }) {
  // Read initial selection from localStorage or default to 'Medicare'
  const [selectedCompanyName, setSelectedCompanyNameState] = useState(() => {
    const saved = localStorage.getItem('careimpact_selected_company');
    return saved || 'Medicare';
  });

  const [selectedPlanName, setSelectedPlanNameState] = useState(() => {
    return localStorage.getItem('careimpact_selected_plan') || null;
  });

  const setSelectedCompany = (compName) => {
    const name = compName || 'Medicare';
    setSelectedCompanyNameState(name);
    setSelectedPlanNameState(null);
    localStorage.setItem('careimpact_selected_company', name);
    localStorage.removeItem('careimpact_selected_plan');
  };

  const setSelectedPlan = (planName) => {
    setSelectedPlanNameState(planName || null);
    if (planName) {
      localStorage.setItem('careimpact_selected_plan', planName);
    } else {
      localStorage.removeItem('careimpact_selected_plan');
    }
  };

  return (
    <CompanyScopeContext.Provider
      value={{
        selectedCompanyName,
        selectedPlanName,
        setSelectedCompany,
        setSelectedPlan,
      }}
    >
      {children}
    </CompanyScopeContext.Provider>
  );
}

export function useCompanyScope() {
  const context = useContext(CompanyScopeContext);
  if (!context) {
    throw new Error('useCompanyScope must be used within a CompanyScopeProvider');
  }
  return context;
}
