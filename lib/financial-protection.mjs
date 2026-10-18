// Protection covers all three annual metrics, including figures not entered yet.
export function financialGroupKey(year, basis) {
  return `FY${Number(year)}:${String(basis).toLowerCase()}`;
}

export function financialGroupLocked(company, year, basis) {
  return (company?.financialExcelLocks || []).includes(financialGroupKey(year, basis));
}

export function legacyFinancialLocked(company, year, basis) {
  if (!year) return false;
  return basis ? financialGroupLocked(company, year, basis)
    : (company?.financialExcelLocks || []).some(key => key.startsWith(`FY${year}:`));
}

export function changedFinancialLocks(company, year, basis, locked) {
  const key = financialGroupKey(year, basis);
  const locks = new Set(company?.financialExcelLocks || []);
  if (locked) locks.add(key);
  else locks.delete(key);
  return [...locks].sort();
}
