/**
 * Authentication Context Provider and Hook
 * Manages user authentication state, session handling, and user details
 */
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// Type definitions for user and authentication data
type User = {
  user_id: string;
};

type UserDetails = {
  role: string;
  user_id: string;
  mydawa_id: string;
  user_name: string;
  user_email: string;
};

// Type definition for the Auth Context
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
  userDetails: UserDetails | null;
  refreshUserDetails: () => Promise<void>;
  login: (
    userId: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

type AuthProviderProps = {
  children: ReactNode;
};

const LOCAL_STORAGE_USER_KEY = "user_data";
const SESSION_STORAGE_KEY = "session_token";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const DETAILS_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
const LOCAL_STORAGE_USER_DETAILS_KEY = "user_details";

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
};

const getSessionData = (): { token: string; timestamp: number } | null => {
  if (typeof window === "undefined") return null;

  try {
    const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionData) return null;

    const parsed = JSON.parse(sessionData);
    const now = Date.now();

    if (now - parsed.timestamp > SESSION_DURATION) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
};

const setSessionData = (token: string): void => {
  if (typeof window === "undefined") return;

  const sessionData = {
    token,
    timestamp: Date.now(),
  };

  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
};

const getUserFromLocalStorage = (): User | null => {
  if (typeof window === "undefined") return null;

  try {
    const userData = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (!userData) return null;

    const parsed = JSON.parse(userData);
    const now = Date.now();

    if (now - parsed.timestamp > SESSION_DURATION) {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      return null;
    }

    return parsed.user;
  } catch {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    return null;
  }
};

const setUserToLocalStorage = (user: User): void => {
  if (typeof window === "undefined") return;

  const userData = {
    user,
    timestamp: Date.now(),
  };

  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userData));
};

const getUserDetailsFromLocalStorage = (): {
  userDetails: UserDetails;
  shouldRefresh: boolean;
} | null => {
  if (typeof window === "undefined") return null;

  try {
    const userDetailsData = localStorage.getItem(
      LOCAL_STORAGE_USER_DETAILS_KEY
    );
    if (!userDetailsData) return null;

    const parsed = JSON.parse(userDetailsData);
    const now = Date.now();

    if (now - parsed.timestamp > SESSION_DURATION) {
      localStorage.removeItem(LOCAL_STORAGE_USER_DETAILS_KEY);
      return null;
    }

    const shouldRefresh = now - parsed.timestamp > DETAILS_REFRESH_INTERVAL;

    return {
      userDetails: parsed.userDetails,
      shouldRefresh,
    };
  } catch {
    localStorage.removeItem(LOCAL_STORAGE_USER_DETAILS_KEY);
    return null;
  }
};

const setUserDetailsToLocalStorage = (userDetails: UserDetails): void => {
  if (typeof window === "undefined") return;

  const userDetailsData = {
    userDetails,
    timestamp: Date.now(),
  };

  localStorage.setItem(
    LOCAL_STORAGE_USER_DETAILS_KEY,
    JSON.stringify(userDetailsData)
  );
};

const clearAllStorageData = (): void => {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  localStorage.removeItem(LOCAL_STORAGE_USER_DETAILS_KEY);
  document.cookie =
    "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  const fetchUserDetails = async (
    userId: string
  ): Promise<UserDetails | null> => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/get_user_details?user_id=${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length >= 2 && data[0] === true) {
        const [, userArray] = data;
        if (userArray && userArray.length > 0) {
          return userArray[0] as UserDetails;
        }
      }

      return null;
    } catch (error) {
      console.error("Error fetching user details:", error);
      return null;
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const storedUser = getUserFromLocalStorage();
        const storedDetailsResult = getUserDetailsFromLocalStorage();

        if (storedUser) {
          setUser(storedUser);

          if (storedDetailsResult) {
            const { userDetails: storedUserDetails, shouldRefresh } =
              storedDetailsResult;

            setUserDetails(storedUserDetails);

            if (shouldRefresh) {
              try {
                const freshDetails = await fetchUserDetails(storedUser.user_id);
                if (
                  freshDetails &&
                  JSON.stringify(storedUserDetails) !==
                    JSON.stringify(freshDetails)
                ) {
                  setUserDetails(freshDetails);
                  setUserDetailsToLocalStorage(freshDetails);
                  toast.info("Your profile information has been updated");
                }
              } catch (error) {
                console.error("Background refresh failed:", error);
              }
            }
          } else {
            const details = await fetchUserDetails(storedUser.user_id);
            if (details) {
              setUserDetails(details);
              setUserDetailsToLocalStorage(details);
            }
          }

          setSessionData(storedUser.user_id);
          document.cookie = `auth-token=${storedUser.user_id}; path=/; max-age=86400; samesite=strict; secure`;
        } else {
          const authToken = getCookie("auth-token");
          const sessionData = getSessionData();

          if (authToken && sessionData) {
            const userData = { user_id: sessionData.token };
            setUser(userData);
            setUserToLocalStorage(userData);

            const details = await fetchUserDetails(sessionData.token);
            if (details) {
              setUserDetails(details);
              setUserDetailsToLocalStorage(details);
            }
          } else {
            clearAllStorageData();
          }
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
        clearAllStorageData();
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (
    userId: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);

    const loginPromise = async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          user_password: password,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length >= 3) {
        const [success, message, userData] = data;

        if (success === true) {
          const user = { user_id: userData.user_id };
          setUser(user);

          setSessionData(userData.user_id);
          setUserToLocalStorage(user);
          document.cookie = `auth-token=${userData.user_id}; path=/; max-age=86400; samesite=strict; secure`;

          const details = await fetchUserDetails(userData.user_id);
          if (details) {
            setUserDetails(details);
            setUserDetailsToLocalStorage(details);
          }

          setTimeout(() => {
            router.push("/dashboard");
          }, 1000);

          return { success: true, message: message || "Login successful!" };
        } else {
          throw new Error(message || "Login failed");
        }
      } else {
        throw new Error("Invalid response format");
      }
    };

    try {
      toast.promise(loginPromise(), {
        loading: "Signing you in...",
        success: "Signed in successfully!",
        error: "Please enter valid credentials.",
      });

      const result = await loginPromise();
      setIsLoading(false);
      return result;
    } catch (error) {
      setIsLoading(false);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const refreshUserDetails = async (): Promise<void> => {
    if (!user?.user_id) return;

    try {
      const freshDetails = await fetchUserDetails(user.user_id);
      if (freshDetails) {
        setUserDetails(freshDetails);
        setUserDetailsToLocalStorage(freshDetails);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.error("Failed to refresh user details:", error);
      toast.error("Failed to update profile");
    }
  };

  const logout = () => {
    setUser(null);
    setUserDetails(null);
    clearAllStorageData();
    toast.success("Logged out successfully");
    router.push("/");
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    userDetails,
    refreshUserDetails,
    isAuthenticated: !!user,
  };

  if (!isInitialized) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <Loader2 className="size-10 animate-spin" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
