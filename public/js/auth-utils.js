// Authentication utility functions for client-side pages

// Check if user is authenticated
const checkAuth = async () => {
  try {
    const response = await fetch("/api/auth/status");
    if (!response.ok) {
      redirectToLogin();
      return false;
    }
    const data = await response.json();
    if (!data.authenticated) {
      redirectToLogin();
      return false;
    }
    return true;
  } catch (error) {
    console.error("Auth check failed:", error);
    redirectToLogin();
    return false;
  }
};

// Redirect to login page
const redirectToLogin = () => {
  window.location.href = "/login";
};

// Logout function
const logout = async () => {
  try {
    const response = await fetch("/api/logout", {
      method: "POST",
    });
    if (response.ok) {
      redirectToLogin();
    } else {
      console.error("Logout failed:", response.status);
      // Force redirect anyway
      redirectToLogin();
    }
  } catch (error) {
    console.error("Logout error:", error);
    // Force redirect anyway
    redirectToLogin();
  }
};

// Enhanced fetch with authentication error handling
const authenticatedFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);

    // If we get 401, redirect to login
    if (response.status === 401) {
      redirectToLogin();
      return null;
    }

    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

// Initialize authentication for a page
const initAuth = async () => {
  const isAuthenticated = await checkAuth();
  return isAuthenticated;
};

// Export functions for use in other scripts
window.authUtils = {
  checkAuth,
  redirectToLogin,
  logout,
  authenticatedFetch,
  initAuth,
};
