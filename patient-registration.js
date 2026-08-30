/* ============================================
   Doctor Link — Patient Registration Flow
   ============================================ */

(function () {
  'use strict';

  // ================================================
  // Constants
  // ================================================

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^[\d\s\-+()]{7,15}$/;
  var PAT_TOTAL_STEPS = 3;

  // ================================================
  // DOM References
  // ================================================

  var patRegScreen = document.getElementById('pat-reg-screen');
  var patRegComplete = document.getElementById('pat-reg-complete');
  var patBackBtn = document.getElementById('pat-reg-back-btn');
  var patContinueBtn = document.getElementById('pat-continue-btn');
  var patStepLabel = document.getElementById('pat-step-label');
  var patProgressFill = document.getElementById('pat-progress-fill');
  var patSteps = patRegScreen.querySelectorAll('.reg-step');

  // Step 1 — Photo
  var patPhotoPreview = document.getElementById('pat-photo-preview');
  var patPhotoImg = document.getElementById('pat-photo-img');
  var patPhotoUploadBtn = document.getElementById('pat-photo-upload-btn');
  var patPhotoRemoveBtn = document.getElementById('pat-photo-remove-btn');
  var patPhotoInput = document.getElementById('pat-photo-input');

  // Step 3 — Review edit buttons
  var patReviewEditBtns = patRegScreen.querySelectorAll('.pat-review-edit');

  // ================================================
  // State
  // ================================================

  var patCurrentStep = 1;
  var patEditingFromReview = false;

  var patData = {
    name: '', mobile: '', email: '', dob: '', gender: '', photoDataUrl: null,
    address: '', language: '', emergencyName: '', emergencyNumber: ''
  };

  // ================================================
  // Entry Point — called by app.js after patient signup
  // ================================================

  window.startPatientRegistration = function (signupData) {
    // Carry over data from signup form
    patData.name = signupData.name || '';
    patData.email = signupData.email || '';
    patData.mobile = signupData.mobile || '';

    // Reset remaining fields
    patData.dob = '';
    patData.gender = '';
    patData.photoDataUrl = null;
    patData.address = '';
    patData.language = '';
    patData.emergencyName = '';
    patData.emergencyNumber = '';
    patEditingFromReview = false;

    patCurrentStep = 1;
    populatePatStep(1);
    showPatStep(1);
    updatePatContinueLabel();

    // Screen transition
    var DL = window.DoctorLink;
    DL.hideScreen(DL.authScreen);
    patRegScreen.removeAttribute('aria-hidden');
    void patRegScreen.offsetHeight;
    patRegScreen.classList.add('visible');
  };

  // ================================================
  // Step Navigation
  // ================================================

  function showPatStep(n) {
    patSteps.forEach(function (s) { s.classList.remove('active'); });
    var el = document.getElementById('pat-step-' + n);
    if (el) el.classList.add('active');
    patCurrentStep = n;
    updatePatProgress();
    updatePatContinueLabel();
    patRegScreen.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updatePatProgress() {
    patStepLabel.textContent = patCurrentStep + ' of ' + PAT_TOTAL_STEPS;
    patProgressFill.style.width = ((patCurrentStep / PAT_TOTAL_STEPS) * 100) + '%';
  }

  function updatePatContinueLabel() {
    if (patCurrentStep === PAT_TOTAL_STEPS) {
      patContinueBtn.textContent = 'Confirm & Continue';
    } else {
      patContinueBtn.textContent = 'Continue';
    }
  }

  // Continue button
  patContinueBtn.addEventListener('click', function () {
    savePatCurrentStep();
    if (!validatePatStep(patCurrentStep)) return;

    // If editing from review, return to review
    if (patEditingFromReview) {
      patEditingFromReview = false;
      renderPatReview();
      showPatStep(PAT_TOTAL_STEPS);
      return;
    }

    if (patCurrentStep < PAT_TOTAL_STEPS) {
      var next = patCurrentStep + 1;
      if (next === PAT_TOTAL_STEPS) renderPatReview();
      populatePatStep(next);
      showPatStep(next);
    } else {
      completePatientRegistration();
    }
  });

  // Back button
  patBackBtn.addEventListener('click', function () {
    savePatCurrentStep();

    // If editing from review, return to review without validating
    if (patEditingFromReview) {
      patEditingFromReview = false;
      renderPatReview();
      showPatStep(PAT_TOTAL_STEPS);
      return;
    }

    if (patCurrentStep > 1) {
      populatePatStep(patCurrentStep - 1);
      showPatStep(patCurrentStep - 1);
    } else {
      // Back from step 1 → return to auth signup screen
      patRegScreen.classList.remove('visible');
      patRegScreen.setAttribute('aria-hidden', 'true');
      var DL = window.DoctorLink;
      DL.showScreen(DL.authScreen);
    }
  });

  // ================================================
  // Save / Populate Step Data
  // ================================================

  function savePatCurrentStep() {
    switch (patCurrentStep) {
      case 1:
        patData.name = gv('pat-name');
        patData.mobile = gv('pat-mobile');
        patData.email = gv('pat-email');
        patData.dob = gv('pat-dob');
        patData.gender = gv('pat-gender');
        break;
      case 2:
        patData.address = gv('pat-address');
        patData.language = gv('pat-language');
        patData.emergencyName = gv('pat-emergency-name');
        patData.emergencyNumber = gv('pat-emergency-number');
        break;
    }
  }

  function populatePatStep(step) {
    switch (step) {
      case 1:
        sv('pat-name', patData.name);
        sv('pat-mobile', patData.mobile);
        sv('pat-email', patData.email);
        sv('pat-dob', patData.dob);
        sv('pat-gender', patData.gender);
        updatePatPhotoPreview();
        break;
      case 2:
        sv('pat-address', patData.address);
        sv('pat-language', patData.language);
        sv('pat-emergency-name', patData.emergencyName);
        sv('pat-emergency-number', patData.emergencyNumber);
        break;
    }
  }

  function gv(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function sv(id, v) { var el = document.getElementById(id); if (el) el.value = v || ''; }

  // ================================================
  // Validation
  // ================================================

  function validatePatStep(step) {
    clearPatStepErrors(step);
    var ok = true;

    switch (step) {
      case 1:
        if (!patData.name) { perr('pat-name', 'Full name is required.'); ok = false; }
        if (!patData.mobile) { perr('pat-mobile', 'Mobile number is required.'); ok = false; }
        else if (!PHONE_RE.test(patData.mobile)) { perr('pat-mobile', 'Please enter a valid mobile number.'); ok = false; }
        if (!patData.email) { perr('pat-email', 'Email address is required.'); ok = false; }
        else if (!EMAIL_RE.test(patData.email)) { perr('pat-email', 'Please enter a valid email address.'); ok = false; }
        if (!patData.dob) { perr('pat-dob', 'Date of birth is required.'); ok = false; }
        else {
          var dobDate = new Date(patData.dob);
          var today = new Date();
          if (dobDate >= today) { perr('pat-dob', 'Date of birth must be in the past.'); ok = false; }
        }
        if (!patData.gender) { perr('pat-gender', 'Please select your gender.'); ok = false; }
        break;

      case 2:
        if (!patData.language) { perr('pat-language', 'Please select your preferred language.'); ok = false; }
        // Validate emergency number format if provided
        if (patData.emergencyNumber && !PHONE_RE.test(patData.emergencyNumber)) {
          perr('pat-emergency-number', 'Please enter a valid phone number.');
          ok = false;
        }
        break;

      // Step 3 (Review) — no validation needed, user just confirms
    }
    return ok;
  }

  function perr(id, msg) {
    var inp = document.getElementById(id);
    var el = document.getElementById(id + '-error');
    if (inp && inp.classList) inp.classList.add('error');
    if (el) { el.textContent = msg; el.classList.add('visible'); }
  }

  function pclr(id) {
    var inp = document.getElementById(id);
    var el = document.getElementById(id + '-error');
    if (inp) inp.classList.remove('error');
    if (el) { el.textContent = ''; el.classList.remove('visible'); }
  }

  function clearPatStepErrors(step) {
    var s = document.getElementById('pat-step-' + step);
    if (!s) return;
    s.querySelectorAll('.input-field, .select-native').forEach(function (f) { f.classList.remove('error'); });
    s.querySelectorAll('.input-error').forEach(function (e) { e.textContent = ''; e.classList.remove('visible'); });
  }

  // Clear errors on typing / selection
  patRegScreen.querySelectorAll('.input-field, .select-native').forEach(function (inp) {
    var evt = (inp.tagName === 'SELECT') ? 'change' : 'input';
    inp.addEventListener(evt, function () { pclr(inp.id); });
  });

  // ================================================
  // Photo Upload
  // ================================================

  patPhotoUploadBtn.addEventListener('click', function () { patPhotoInput.click(); });

  patPhotoInput.addEventListener('change', function () {
    var file = patPhotoInput.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      patData.photoDataUrl = e.target.result;
      updatePatPhotoPreview();
    };
    reader.readAsDataURL(file);
  });

  patPhotoRemoveBtn.addEventListener('click', function () {
    patData.photoDataUrl = null;
    patPhotoInput.value = '';
    updatePatPhotoPreview();
  });

  function updatePatPhotoPreview() {
    var ph = patPhotoPreview.querySelector('.photo-placeholder');
    if (patData.photoDataUrl) {
      patPhotoImg.src = patData.photoDataUrl;
      patPhotoImg.style.display = 'block';
      if (ph) ph.style.display = 'none';
      patPhotoRemoveBtn.style.display = 'inline-flex';
      patPhotoPreview.classList.add('has-photo');
    } else {
      patPhotoImg.src = '';
      patPhotoImg.style.display = 'none';
      if (ph) ph.style.display = 'block';
      patPhotoRemoveBtn.style.display = 'none';
      patPhotoPreview.classList.remove('has-photo');
    }
  }

  // ================================================
  // Review
  // ================================================

  function renderPatReview() {
    // Basic info
    var bh = prf('Full Name', patData.name) +
             prf('Mobile Number', patData.mobile) +
             prf('Email Address', patData.email) +
             prf('Date of Birth', formatDob(patData.dob)) +
             prf('Gender', patData.gender);
    if (patData.photoDataUrl) {
      bh += '<div class="review-field"><span class="review-label">Profile Photo</span>' +
            '<img class="review-photo" src="' + patData.photoDataUrl + '" alt="Profile"></div>';
    }
    document.getElementById('pat-review-basic').innerHTML = bh;

    // Additional info
    var ah = prf('Address / Locality', patData.address || '\u2014') +
             prf('Preferred Language', patData.language) +
             prf('Emergency Contact Name', patData.emergencyName || '\u2014') +
             prf('Emergency Contact Number', patData.emergencyNumber || '\u2014');
    document.getElementById('pat-review-additional').innerHTML = ah;
  }

  function prf(label, value) {
    return '<div class="review-field"><span class="review-label">' + pesc(label) +
           '</span><span class="review-value">' + pesc(value || '\u2014') + '</span></div>';
  }

  function formatDob(dateStr) {
    if (!dateStr) return '\u2014';
    var parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var monthIndex = parseInt(parts[1], 10) - 1;
    return parts[2] + ' ' + (months[monthIndex] || parts[1]) + ' ' + parts[0];
  }

  function pesc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // Edit buttons
  patReviewEditBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var step = parseInt(btn.getAttribute('data-pat-step'), 10);
      patEditingFromReview = true;
      savePatCurrentStep();
      populatePatStep(step);
      showPatStep(step);
    });
  });

  // ================================================
  // Registration Complete
  // ================================================

  function completePatientRegistration() {
    // Expose patient data for the dashboard
    window.DoctorLink.patientData = {
      name: patData.name,
      email: patData.email,
      mobile: patData.mobile,
      photoDataUrl: patData.photoDataUrl,
      dob: patData.dob,
      gender: patData.gender,
      address: patData.address,
      lang: patData.language,
      emergName: patData.emergencyName,
      emergPhone: patData.emergencyNumber
    };

    patRegScreen.classList.remove('visible');
    patRegScreen.setAttribute('aria-hidden', 'true');

    patRegComplete.removeAttribute('aria-hidden');
    void patRegComplete.offsetHeight;
    patRegComplete.classList.add('visible');

    // Auto-transition to dashboard after a brief moment
    setTimeout(function () {
      if (typeof window.openPatientDashboard === 'function') {
        patRegComplete.classList.remove('visible');
        patRegComplete.setAttribute('aria-hidden', 'true');
        window.openPatientDashboard(window.DoctorLink.patientData);
      }
    }, 2500);
  }

})();
