/* ============================================
   Doctor Link — App Logic
   ============================================ */

(function () {
  'use strict';

  // ========================================
  // Elements
  // ========================================
  var launchScreen = document.getElementById('launch-screen');
  var roleScreen = document.getElementById('role-screen');
  var authScreen = document.getElementById('auth-screen');
  var roleCards = document.querySelectorAll('.role-card');

  // Auth elements
  var authBack = document.getElementById('auth-back');
  var authTitle = document.getElementById('auth-title');
  var authSubtitle = document.getElementById('auth-subtitle');
  var loginForm = document.getElementById('login-form');
  var signupForm = document.getElementById('signup-form');
  var switchToSignup = document.getElementById('switch-to-signup');
  var switchToLogin = document.getElementById('switch-to-login');
  var forgotPassword = document.getElementById('forgot-password');
  var passwordToggles = document.querySelectorAll('.password-toggle');

  // ========================================
  // State
  // ========================================
  var currentRole = null;
  var currentAuthMode = 'login';

  // ========================================
  // Constants
  // ========================================
  var LAUNCH_DISPLAY_MS = 2000;
  var LAUNCH_EXIT_MS = 500;
  var ROLE_SELECT_DELAY_MS = 250;

  // Validation patterns
  var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_REGEX = /^[\d\s\-+()]{7,15}$/;

  // ========================================
  // Utility Functions
  // ========================================
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ========================================
  // Screen Navigation
  // ========================================
  function showScreen(screen) {
    screen.removeAttribute('aria-hidden');
    // Force reflow so the transition plays
    void screen.offsetHeight;
    screen.classList.add('visible');
  }

  function hideScreen(screen) {
    screen.classList.remove('visible');
    screen.setAttribute('aria-hidden', 'true');
  }

  // ========================================
  // Launch Animation
  // ========================================
  function endLaunch() {
    launchScreen.classList.add('exit');
    setTimeout(function () {
      launchScreen.style.display = 'none';
      showScreen(roleScreen);
    }, LAUNCH_EXIT_MS);
  }

  setTimeout(endLaunch, LAUNCH_DISPLAY_MS);

  // ========================================
  // Role Selection → Auth
  // ========================================
  roleCards.forEach(function (card) {
    card.addEventListener('click', function () {
      var role = card.id === 'role-doctor' ? 'doctor' : 'patient';

      // Visual feedback — highlight the selected card
      roleCards.forEach(function (c) { c.classList.remove('selected'); });
      card.classList.add('selected');

      // Navigate to auth after a brief visual pause
      setTimeout(function () {
        openAuth(role);
      }, ROLE_SELECT_DELAY_MS);
    });
  });

  // ========================================
  // Auth Screen Management
  // ========================================
  function openAuth(role) {
    currentRole = role;
    currentAuthMode = 'login';

    // Update heading to reflect role and mode
    updateAuthHeading();

    // Reset forms to clean state
    resetForms();

    // Show login form by default
    loginForm.classList.add('active');
    signupForm.classList.remove('active');

    // Transition: hide role screen, show auth screen
    hideScreen(roleScreen);
    showScreen(authScreen);
  }

  function closeAuth() {
    hideScreen(authScreen);

    // Clear role selection on the cards
    roleCards.forEach(function (c) { c.classList.remove('selected'); });
    currentRole = null;

    // Brief delay then show role screen again
    setTimeout(function () {
      showScreen(roleScreen);
    }, 50);
  }

  function updateAuthHeading() {
    var roleName = capitalize(currentRole);

    if (currentAuthMode === 'login') {
      authTitle.textContent = roleName + ' Login';
      authSubtitle.textContent = 'Welcome back! Please sign in to continue.';
    } else {
      authTitle.textContent = roleName + ' Sign Up';
      authSubtitle.textContent = 'Create your Doctor Link account.';
    }
  }

  // Back button
  authBack.addEventListener('click', function () {
    closeAuth();
  });

  // ========================================
  // Login ↔ Sign Up Toggle
  // ========================================
  switchToSignup.addEventListener('click', function (e) {
    e.preventDefault();
    currentAuthMode = 'signup';
    updateAuthHeading();
    resetForms();
    loginForm.classList.remove('active');
    signupForm.classList.add('active');
    // Scroll to top of auth container
    authScreen.scrollTo({ top: 0, behavior: 'smooth' });
  });

  switchToLogin.addEventListener('click', function (e) {
    e.preventDefault();
    currentAuthMode = 'login';
    updateAuthHeading();
    resetForms();
    signupForm.classList.remove('active');
    loginForm.classList.add('active');
    authScreen.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Forgot password — prevent navigation (feature not built yet)
  forgotPassword.addEventListener('click', function (e) {
    e.preventDefault();
  });

  // ========================================
  // Password Visibility Toggle
  // ========================================
  passwordToggles.forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      var targetId = toggle.getAttribute('data-target');
      var input = document.getElementById(targetId);
      var eyeOpen = toggle.querySelector('.eye-open');
      var eyeClosed = toggle.querySelector('.eye-closed');

      if (input.type === 'password') {
        input.type = 'text';
        eyeOpen.style.display = 'none';
        eyeClosed.style.display = 'block';
        toggle.setAttribute('aria-label', 'Hide password');
      } else {
        input.type = 'password';
        eyeOpen.style.display = 'block';
        eyeClosed.style.display = 'none';
        toggle.setAttribute('aria-label', 'Show password');
      }
    });
  });

  // ========================================
  // Validation Helpers
  // ========================================
  function showError(fieldId, message) {
    var input = document.getElementById(fieldId);
    var errorEl = document.getElementById(fieldId + '-error');
    if (input) input.classList.add('error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
  }

  function clearError(fieldId) {
    var input = document.getElementById(fieldId);
    var errorEl = document.getElementById(fieldId + '-error');
    if (input) input.classList.remove('error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }

  function clearAllErrors(formEl) {
    var inputs = formEl.querySelectorAll('.input-field');
    inputs.forEach(function (input) {
      clearError(input.id);
    });
  }

  // ========================================
  // Form Validation
  // ========================================
  function validateLoginForm() {
    var valid = true;
    clearAllErrors(loginForm);

    var email = document.getElementById('login-email').value.trim();
    var password = document.getElementById('login-password').value;

    if (!email) {
      showError('login-email', 'Email is required.');
      valid = false;
    } else if (!EMAIL_REGEX.test(email)) {
      showError('login-email', 'Please enter a valid email address.');
      valid = false;
    }

    if (!password) {
      showError('login-password', 'Password is required.');
      valid = false;
    } else if (password.length < 8) {
      showError('login-password', 'Password must be at least 8 characters.');
      valid = false;
    }

    return valid;
  }

  function validateSignupForm() {
    var valid = true;
    clearAllErrors(signupForm);

    var name = document.getElementById('signup-name').value.trim();
    var email = document.getElementById('signup-email').value.trim();
    var mobile = document.getElementById('signup-mobile').value.trim();
    var password = document.getElementById('signup-password').value;
    var confirm = document.getElementById('signup-confirm').value;

    if (!name) {
      showError('signup-name', 'Full name is required.');
      valid = false;
    }

    if (!email) {
      showError('signup-email', 'Email is required.');
      valid = false;
    } else if (!EMAIL_REGEX.test(email)) {
      showError('signup-email', 'Please enter a valid email address.');
      valid = false;
    }

    if (!mobile) {
      showError('signup-mobile', 'Mobile number is required.');
      valid = false;
    } else if (!PHONE_REGEX.test(mobile)) {
      showError('signup-mobile', 'Please enter a valid mobile number.');
      valid = false;
    }

    if (!password) {
      showError('signup-password', 'Password is required.');
      valid = false;
    } else if (password.length < 8) {
      showError('signup-password', 'Password must be at least 8 characters.');
      valid = false;
    }

    if (!confirm) {
      showError('signup-confirm', 'Please confirm your password.');
      valid = false;
    } else if (password && confirm !== password) {
      showError('signup-confirm', 'Passwords do not match.');
      valid = false;
    }

    return valid;
  }

  // ========================================
  // Form Submission (frontend-only)
  // ========================================
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (validateLoginForm()) {
      // Patient login → open Patient Dashboard (prototype: no real auth)
      if (currentRole === 'patient' && typeof window.openPatientDashboard === 'function') {
        hideScreen(authScreen);
        var existingPatData = window.DoctorLink && window.DoctorLink.patientData ? window.DoctorLink.patientData : {
          name: '',
          photoDataUrl: null
        };
        window.openPatientDashboard(existingPatData);
      }
      // Doctor login → open Doctor Dashboard
      if (currentRole === 'doctor' && typeof window.openDoctorDashboard === 'function') {
        hideScreen(authScreen);
        window.openDoctorDashboard({
          name: '',
          photoDataUrl: null,
          specialization: '',
          practiceType: '',
          facilities: []
        });
      }
    }
  });

  signupForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (validateSignupForm()) {
      // Doctor signup → start Doctor registration flow
      if (currentRole === 'doctor' && typeof window.startDoctorRegistration === 'function') {
        window.startDoctorRegistration({
          name: document.getElementById('signup-name').value.trim(),
          email: document.getElementById('signup-email').value.trim(),
          mobile: document.getElementById('signup-mobile').value.trim()
        });
      }
      // Patient signup → start Patient registration flow
      if (currentRole === 'patient' && typeof window.startPatientRegistration === 'function') {
        window.startPatientRegistration({
          name: document.getElementById('signup-name').value.trim(),
          email: document.getElementById('signup-email').value.trim(),
          mobile: document.getElementById('signup-mobile').value.trim()
        });
      }
    }
  });

  // ========================================
  // Real-time Error Clearing
  // ========================================
  document.querySelectorAll('.input-field').forEach(function (input) {
    input.addEventListener('input', function () {
      clearError(input.id);
    });
  });

  // ========================================
  // Form Reset
  // ========================================
  function resetForms() {
    loginForm.reset();
    signupForm.reset();
    clearAllErrors(loginForm);
    clearAllErrors(signupForm);

    // Reset all password toggles to hidden state
    passwordToggles.forEach(function (toggle) {
      var targetId = toggle.getAttribute('data-target');
      var input = document.getElementById(targetId);
      var eyeOpen = toggle.querySelector('.eye-open');
      var eyeClosed = toggle.querySelector('.eye-closed');
      if (input) input.type = 'password';
      if (eyeOpen) eyeOpen.style.display = 'block';
      if (eyeClosed) eyeClosed.style.display = 'none';
      toggle.setAttribute('aria-label', 'Show password');
    });
  }

  // ========================================
  // Expose namespace for registration module
  // ========================================
  window.DoctorLink = {
    showScreen: showScreen,
    hideScreen: hideScreen,
    authScreen: authScreen,
    roleScreen: roleScreen
  };

})();
