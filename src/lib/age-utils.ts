/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth: string | Date): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Check if a person is at least a certain age
 */
export const isAtLeastAge = (dateOfBirth: string | Date, minimumAge: number): boolean => {
  return calculateAge(dateOfBirth) >= minimumAge;
};
