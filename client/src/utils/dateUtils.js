/**
 * Calculates the current financial year based on the current date.
 * Financial Year in India runs from April 1st to March 31st.
 * 
 * @returns {string} Financial Year string in "YYYY-YYYY" format (e.g., "2024-2025")
 */
export const getCurrentFinancialYear = () => {
    const today = new Date();
    const month = today.getMonth(); // 0-indexed (0 = January, 3 = April)
    const year = today.getFullYear();

    let startYear;

    // If current month is April (3) or later, FY starts this year
    if (month >= 3) {
        startYear = year;
    } else {
        // If current month is Jan-Mar, FY started previous year
        startYear = year - 1;
    }

    return `${startYear}-${startYear + 1}`;
};

/**
 * Calculates the previous financial year based on the current date.
 * 
 * @returns {string} Previous Financial Year string in "YYYY-YYYY" format (e.g., "2023-2024")
 */
export const getPreviousFinancialYear = () => {
    const currentFY = getCurrentFinancialYear();
    const [startYear] = currentFY.split('-');
    const prevStartYear = parseInt(startYear) - 1;
    return `${prevStartYear}-${prevStartYear + 1}`;
};
