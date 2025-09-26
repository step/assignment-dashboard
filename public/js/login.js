document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");
  const submitButton = loginForm.querySelector('button[type="submit"]');

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    errorMessage.className = "error-message";
  }

  function showSuccess(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    errorMessage.className = "success-message";
  }

  function hideMessage() {
    errorMessage.style.display = "none";
  }

  function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? "Logging in..." : "Login";
  }

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    hideMessage();
    setLoading(true);

    const formData = new FormData(loginForm);
    const secretMessage = formData.get("secretMessage");

    if (!secretMessage || secretMessage.trim().length === 0) {
      showError("Please enter a secret message");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secretMessage: secretMessage.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccess("Login successful! Redirecting...");
        // Redirect to the main dashboard after a short delay
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        showError(data.error || "Invalid secret message");
      }
    } catch (error) {
      console.error("Login error:", error);
      showError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  });

  // Clear error message when user starts typing
  const secretInput = document.getElementById("secretMessage");
  secretInput.addEventListener("input", hideMessage);

  // Check if user is already logged in
  checkAuthStatus();
});

async function checkAuthStatus() {
  try {
    const response = await fetch("/api/auth/status");
    if (response.ok) {
      const data = await response.json();
      if (data.authenticated) {
        // User is already logged in, redirect to dashboard
        window.location.href = "/";
      }
    }
  } catch (error) {
    // Ignore error, user is not logged in
    console.debug("Auth status check failed:", error);
  }
}
