const USER_TOKEN_KEY = 'facility_booking_user';
const ADMIN_TOKEN_KEY = 'facility_admin_token';

interface UserIdentifier {
  email: string;
  phone: string;
  studentId?: string;
}

export const saveUserIdentifier = (data: UserIdentifier): void => {
  localStorage.setItem(USER_TOKEN_KEY, JSON.stringify(data));
};

export const getUserIdentifier = (): UserIdentifier | null => {
  const stored = localStorage.getItem(USER_TOKEN_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const clearUserIdentifier = (): void => {
  localStorage.removeItem(USER_TOKEN_KEY);
};

export const saveAdminToken = (token: string, adminId: string): void => {
  localStorage.setItem(ADMIN_TOKEN_KEY, JSON.stringify({ token, adminId }));
};

export const getAdminToken = (): { token: string; adminId: string } | null => {
  const stored = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const clearAdminToken = (): void => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
};

export const isAdminLoggedIn = (): boolean => {
  return getAdminToken() !== null;
};
