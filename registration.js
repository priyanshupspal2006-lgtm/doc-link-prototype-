/* ============================================
   Doctor Link — Registration Flow
   ============================================ */

(function () {
  'use strict';

  // ================================================
  // Constants & Mock Data
  // ================================================

  var SPECIALIZATIONS = [
    'General Physician', 'Cardiologist', 'Dermatologist',
    'Pediatrician', 'Orthopedic', 'Gynecologist',
    'ENT Specialist', 'Dentist', 'Ophthalmologist',
    'Psychiatrist', 'Other'
  ];

  var MOCK_FACILITIES = [
    { id: 1, name: 'District Hospital', type: 'Hospital', area: 'Civil Lines', address: 'Civil Lines, Sri Ganganagar' },
    { id: 2, name: 'Community Health Center', type: 'Hospital', area: 'Suratgarh Road', address: 'Suratgarh Road, Sri Ganganagar' },
    { id: 3, name: 'Urban Health Center', type: 'Clinic', area: 'Sadh Basti', address: 'Sadh Basti, Sri Ganganagar' },
    { id: 4, name: 'Primary Health Center', type: 'Clinic', area: 'Lalgarh Colony', address: 'Lalgarh Colony, Sri Ganganagar' },
    { id: 5, name: 'Sub-District Hospital', type: 'Hospital', area: 'Raisinghnagar Road', address: 'Raisinghnagar Road, Sri Ganganagar' }
  ];

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^[\d\s\-+()]{7,15}$/;
  var TOTAL_STEPS = 4;

  // ================================================
  // DOM References
  // ================================================

  var regScreen = document.getElementById('reg-screen');
  var regComplete = document.getElementById('reg-complete');
  var regBackBtn = document.getElementById('reg-back-btn');
  var regContinueBtn = document.getElementById('reg-continue-btn');
  var regStepLabel = document.getElementById('reg-step-label');
  var regProgressFill = document.getElementById('reg-progress-fill');
  var regSteps = document.querySelectorAll('.reg-step');

  // Step 1 — Photo
  var photoPreview = document.getElementById('photo-preview');
  var photoImg = document.getElementById('photo-img');
  var photoUploadBtn = document.getElementById('photo-upload-btn');
  var photoRemoveBtn = document.getElementById('photo-remove-btn');
  var photoInput = document.getElementById('photo-input');

  // Step 2 — Specialization dropdown
  var specSelect = document.getElementById('spec-select');
  var specInput = document.getElementById('reg-specialization');
  var specDropdown = document.getElementById('spec-list');
  var specChevron = specSelect ? specSelect.querySelector('.select-chevron') : null;

  // Step 3 — Practice
  var practiceCards = document.querySelectorAll('.practice-card');
  var facilitySection = document.getElementById('facility-section');
  var facilitySearchInput = document.getElementById('facility-search');
  var facilityList = document.getElementById('facility-list');
  var addFacilityBtn = document.getElementById('add-facility-btn');
  var addFacilityForm = document.getElementById('add-facility-form');
  var addFacilityCancel = document.getElementById('add-facility-cancel');
  var addFacilitySave = document.getElementById('add-facility-save');

  // Step 4 — Review
  var reviewEditBtns = document.querySelectorAll('.review-edit-btn');

  // Complete
  var demoIdText = document.getElementById('demo-id-text');
  var copyIdBtn = document.getElementById('copy-id-btn');
  var copyLabel = document.getElementById('copy-label');

  // ================================================
  // State
  // ================================================

  var currentStep = 1;
  var editingFromReview = false;

  var regData = {
    name: '', email: '', mobile: '', photoDataUrl: null,
    specialization: '', registrationNumber: '', experience: '',
    qualification: '', gender: '', bio: '',
    practiceType: '', selectedFacilities: []
  };

  var allFacilities = MOCK_FACILITIES.slice();
  var nextFacilityId = MOCK_FACILITIES.length + 1;

  // ================================================
  // Entry Point — called by app.js after signup
  // ================================================

  window.startDoctorRegistration = function (signupData) {
    // Carry over data from signup form
    regData.name = signupData.name || '';
    regData.email = signupData.email || '';
    regData.mobile = signupData.mobile || '';

    // Reset remaining fields
    regData.photoDataUrl = null;
    regData.specialization = '';
    regData.registrationNumber = '';
    regData.experience = '';
    regData.qualification = '';
    regData.gender = '';
    regData.bio = '';
    regData.practiceType = '';
    regData.selectedFacilities = [];
    editingFromReview = false;

    // Reset user-added facilities
    allFacilities = MOCK_FACILITIES.slice();
    nextFacilityId = MOCK_FACILITIES.length + 1;

    currentStep = 1;
    populateStep(1);
    showStep(1);

    // Screen transition
    var DL = window.DoctorLink;
    DL.hideScreen(DL.authScreen);
    regScreen.removeAttribute('aria-hidden');
    void regScreen.offsetHeight;
    regScreen.classList.add('visible');
  };

  // ================================================
  // Step Navigation
  // ================================================

  function showStep(n) {
    regSteps.forEach(function (s) { s.classList.remove('active'); });
    var el = document.getElementById('reg-step-' + n);
    if (el) el.classList.add('active');
    currentStep = n;
    updateProgress();
    regScreen.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateProgress() {
    regStepLabel.textContent = 'Step ' + currentStep + ' of ' + TOTAL_STEPS;
    regProgressFill.style.width = ((currentStep / TOTAL_STEPS) * 100) + '%';
  }

  // Continue button
  regContinueBtn.addEventListener('click', function () {
    saveCurrentStep();
    if (!validateStep(currentStep)) return;

    // If editing from review, return to review
    if (editingFromReview) {
      editingFromReview = false;
      renderReview();
      showStep(TOTAL_STEPS);
      return;
    }

    if (currentStep < TOTAL_STEPS) {
      var next = currentStep + 1;
      if (next === TOTAL_STEPS) renderReview();
      populateStep(next);
      showStep(next);
    } else {
      completeRegistration();
    }
  });

  // Back button
  regBackBtn.addEventListener('click', function () {
    saveCurrentStep();

    // If editing from review, return to review without validating
    if (editingFromReview) {
      editingFromReview = false;
      renderReview();
      showStep(TOTAL_STEPS);
      return;
    }

    if (currentStep > 1) {
      populateStep(currentStep - 1);
      showStep(currentStep - 1);
    } else {
      // Back from step 1 → return to auth signup screen
      regScreen.classList.remove('visible');
      regScreen.setAttribute('aria-hidden', 'true');
      var DL = window.DoctorLink;
      DL.showScreen(DL.authScreen);
    }
  });

  // ================================================
  // Save / Populate Step Data
  // ================================================

  function saveCurrentStep() {
    switch (currentStep) {
      case 1:
        regData.name = gv('reg-name');
        regData.email = gv('reg-email');
        regData.mobile = gv('reg-mobile');
        break;
      case 2:
        regData.specialization = gv('reg-specialization');
        regData.registrationNumber = gv('reg-registration');
        regData.experience = gv('reg-experience');
        regData.qualification = gv('reg-qualification');
        regData.gender = gv('reg-gender');
        regData.bio = gv('reg-bio');
        break;
      // Step 3 data saved via click handlers
    }
  }

  function populateStep(step) {
    switch (step) {
      case 1:
        sv('reg-name', regData.name);
        sv('reg-email', regData.email);
        sv('reg-mobile', regData.mobile);
        updatePhotoPreview();
        break;
      case 2:
        sv('reg-specialization', regData.specialization);
        sv('reg-registration', regData.registrationNumber);
        sv('reg-experience', regData.experience);
        sv('reg-qualification', regData.qualification);
        sv('reg-gender', regData.gender);
        sv('reg-bio', regData.bio);
        break;
      case 3:
        practiceCards.forEach(function (c) {
          c.classList.toggle('selected', c.getAttribute('data-type') === regData.practiceType);
        });
        updateFacilityVisibility();
        renderFacilities();
        break;
    }
  }

  function gv(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function sv(id, v) { var el = document.getElementById(id); if (el) el.value = v || ''; }

  // ================================================
  // Validation
  // ================================================

  function validateStep(step) {
    clearStepErrors(step);
    var ok = true;

    switch (step) {
      case 1:
        if (!regData.name) { err('reg-name', 'Full name is required.'); ok = false; }
        if (!regData.email) { err('reg-email', 'Email is required.'); ok = false; }
        else if (!EMAIL_RE.test(regData.email)) { err('reg-email', 'Please enter a valid email.'); ok = false; }
        if (!regData.mobile) { err('reg-mobile', 'Mobile number is required.'); ok = false; }
        else if (!PHONE_RE.test(regData.mobile)) { err('reg-mobile', 'Please enter a valid mobile number.'); ok = false; }
        break;

      case 2:
        if (!regData.specialization) { err('reg-specialization', 'Specialization is required.'); ok = false; }
        if (!regData.registrationNumber) { err('reg-registration', 'Registration number is required.'); ok = false; }
        if (regData.experience === '') { err('reg-experience', 'Years of experience is required.'); ok = false; }
        if (!regData.qualification) { err('reg-qualification', 'Qualification is required.'); ok = false; }
        if (!regData.gender) { err('reg-gender', 'Please select your gender.'); ok = false; }
        break;

      case 3:
        if (!regData.practiceType) {
          err('practice-type', 'Please select your practice type.');
          ok = false;
        } else if (regData.practiceType !== 'independent' && regData.selectedFacilities.length === 0) {
          err('facility-select', 'Please select or add at least one facility.');
          ok = false;
        }
        break;
    }
    return ok;
  }

  function err(id, msg) {
    var inp = document.getElementById(id);
    var el = document.getElementById(id + '-error');
    if (inp && inp.classList) inp.classList.add('error');
    if (el) { el.textContent = msg; el.classList.add('visible'); }
  }

  function clr(id) {
    var inp = document.getElementById(id);
    var el = document.getElementById(id + '-error');
    if (inp) inp.classList.remove('error');
    if (el) { el.textContent = ''; el.classList.remove('visible'); }
  }

  function clearStepErrors(step) {
    var s = document.getElementById('reg-step-' + step);
    if (!s) return;
    s.querySelectorAll('.input-field, .select-native').forEach(function (f) { f.classList.remove('error'); });
    s.querySelectorAll('.input-error').forEach(function (e) { e.textContent = ''; e.classList.remove('visible'); });
  }

  // Clear errors on typing
  if (regScreen) {
    regScreen.querySelectorAll('.input-field, .select-native, .textarea-field').forEach(function (inp) {
      var evt = (inp.tagName === 'SELECT') ? 'change' : 'input';
      inp.addEventListener(evt, function () { clr(inp.id); });
    });
  }

  // ================================================
  // Photo Upload
  // ================================================

  if (photoUploadBtn) {
    photoUploadBtn.addEventListener('click', function () { photoInput.click(); });
  }

  if (photoInput) {
    photoInput.addEventListener('change', function () {
      var file = photoInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        regData.photoDataUrl = e.target.result;
        updatePhotoPreview();
      };
      reader.readAsDataURL(file);
    });
  }

  if (photoRemoveBtn) {
    photoRemoveBtn.addEventListener('click', function () {
      regData.photoDataUrl = null;
      photoInput.value = '';
      updatePhotoPreview();
    });
  }

  function updatePhotoPreview() {
    if (!photoPreview) return;
    var ph = photoPreview.querySelector('.photo-placeholder');
    if (regData.photoDataUrl) {
      photoImg.src = regData.photoDataUrl;
      photoImg.style.display = 'block';
      if (ph) ph.style.display = 'none';
      photoRemoveBtn.style.display = 'inline-flex';
      photoPreview.classList.add('has-photo');
    } else {
      photoImg.src = '';
      photoImg.style.display = 'none';
      if (ph) ph.style.display = 'block';
      photoRemoveBtn.style.display = 'none';
      photoPreview.classList.remove('has-photo');
    }
  }

  // ================================================
  // Specialization Searchable Dropdown
  // ================================================

  var specOpen = false;

  function renderSpecOptions(filter) {
    specDropdown.innerHTML = '';
    var matches = SPECIALIZATIONS.filter(function (s) {
      return !filter || s.toLowerCase().indexOf(filter.toLowerCase()) !== -1;
    });

    if (!matches.length) {
      var li = document.createElement('li');
      li.className = 'select-option select-option--empty';
      li.textContent = 'No matches found';
      specDropdown.appendChild(li);
      return;
    }

    matches.forEach(function (s) {
      var li = document.createElement('li');
      li.className = 'select-option' + (s === specInput.value ? ' selected' : '');
      li.setAttribute('role', 'option');
      li.textContent = s;
      li.addEventListener('click', function () {
        specInput.value = s;
        closeSpec();
        clr('reg-specialization');
      });
      specDropdown.appendChild(li);
    });
  }

  function openSpec() {
    if (specOpen) return;
    specOpen = true;
    renderSpecOptions(specInput.value);
    specDropdown.style.display = 'block';
    specInput.setAttribute('aria-expanded', 'true');
  }

  function closeSpec() {
    specOpen = false;
    specDropdown.style.display = 'none';
    specInput.setAttribute('aria-expanded', 'false');
  }

  if (specInput) {
    specInput.addEventListener('focus', openSpec);
    specInput.addEventListener('input', function () {
      renderSpecOptions(specInput.value);
      if (!specOpen) openSpec();
    });
  }

  if (specChevron) {
    specChevron.addEventListener('click', function () {
      if (specOpen) closeSpec(); else { specInput.focus(); openSpec(); }
    });
  }

  document.addEventListener('click', function (e) {
    if (specOpen && specSelect && !specSelect.contains(e.target)) closeSpec();
  });

  // ================================================
  // Practice Type Selection
  // ================================================

  practiceCards.forEach(function (card) {
    card.addEventListener('click', function () {
      practiceCards.forEach(function (c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      regData.practiceType = card.getAttribute('data-type');
      clr('practice-type');
      if (regData.practiceType === 'independent') {
        regData.selectedFacilities = [];
      }
      updateFacilityVisibility();
      renderFacilities();
    });
  });

  function updateFacilityVisibility() {
    var show = regData.practiceType && regData.practiceType !== 'independent';
    if (facilitySection) facilitySection.style.display = show ? 'block' : 'none';
    if (addFacilityForm) addFacilityForm.style.display = 'none';
    if (addFacilityBtn) addFacilityBtn.style.display = show ? 'flex' : 'none';
  }

  // ================================================
  // Facility Search & Selection
  // ================================================

  function getFilteredFacilities(q) {
    var typeFilter = null;
    if (regData.practiceType === 'hospital') typeFilter = 'Hospital';
    else if (regData.practiceType === 'clinic') typeFilter = 'Clinic';

    return allFacilities.filter(function (f) {
      var tm = !typeFilter || f.type === typeFilter;
      var qm = !q || f.name.toLowerCase().indexOf(q.toLowerCase()) !== -1 ||
               f.area.toLowerCase().indexOf(q.toLowerCase()) !== -1;
      return tm && qm;
    });
  }

  function renderFacilities() {
    if (!facilityList) return;
    var q = facilitySearchInput ? facilitySearchInput.value.trim() : '';
    var list = getFilteredFacilities(q);
    facilityList.innerHTML = '';

    if (!list.length) {
      facilityList.innerHTML = '<div class="facility-empty">No facilities found. Add a new one below.</div>';
      return;
    }

    list.forEach(function (f) {
      var sel = regData.selectedFacilities.some(function (sf) { return sf.id === f.id; });
      var div = document.createElement('div');
      div.className = 'facility-item' + (sel ? ' selected' : '');
      div.innerHTML =
        '<div class="facility-item-info">' +
          '<span class="facility-item-name">' + esc(f.name) + '</span>' +
          '<span class="facility-item-detail">' + esc(f.type) + ' &middot; ' + esc(f.area) + '</span>' +
        '</div>' +
        '<div class="facility-item-check">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>' +
        '</div>';
      div.addEventListener('click', function () {
        toggleFacility(f);
        renderFacilities();
        clr('facility-select');
      });
      facilityList.appendChild(div);
    });
  }

  function toggleFacility(fac) {
    var idx = -1;
    regData.selectedFacilities.forEach(function (sf, i) { if (sf.id === fac.id) idx = i; });
    if (idx >= 0) regData.selectedFacilities.splice(idx, 1);
    else regData.selectedFacilities.push(fac);
  }

  if (facilitySearchInput) {
    facilitySearchInput.addEventListener('input', renderFacilities);
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ================================================
  // Add New Facility
  // ================================================

  if (addFacilityBtn) {
    addFacilityBtn.addEventListener('click', function () {
      addFacilityForm.style.display = 'block';
      addFacilityBtn.style.display = 'none';
      sv('new-fac-name', ''); sv('new-fac-type', '');
      sv('new-fac-address', ''); sv('new-fac-area', ''); sv('new-fac-contact', '');
      ['new-fac-name', 'new-fac-type', 'new-fac-address', 'new-fac-area'].forEach(clr);
    });
  }

  if (addFacilityCancel) {
    addFacilityCancel.addEventListener('click', function () {
      addFacilityForm.style.display = 'none';
      addFacilityBtn.style.display = 'flex';
    });
  }

  if (addFacilitySave) {
    addFacilitySave.addEventListener('click', function () {
      var ok = true;
      ['new-fac-name', 'new-fac-type', 'new-fac-address', 'new-fac-area'].forEach(clr);

      var name = gv('new-fac-name');
      var type = gv('new-fac-type');
      var address = gv('new-fac-address');
      var area = gv('new-fac-area');
      var contact = gv('new-fac-contact');

      if (!name) { err('new-fac-name', 'Facility name is required.'); ok = false; }
      if (!type) { err('new-fac-type', 'Please select a type.'); ok = false; }
      if (!address) { err('new-fac-address', 'Address is required.'); ok = false; }
      if (!area) { err('new-fac-area', 'Area/locality is required.'); ok = false; }
      if (!ok) return;

      var fac = {
        id: nextFacilityId++, name: name, type: type,
        area: area, address: address + ', Sri Ganganagar, Rajasthan',
        contact: contact, isNew: true
      };

      allFacilities.push(fac);
      regData.selectedFacilities.push(fac);

      addFacilityForm.style.display = 'none';
      addFacilityBtn.style.display = 'flex';
      renderFacilities();
      clr('facility-select');
    });
  }

  // ================================================
  // Review
  // ================================================

  function renderReview() {
    // Basic info
    var bh = rf('Full Name', regData.name) +
             rf('Email', regData.email) +
             rf('Mobile', regData.mobile);
    if (regData.photoDataUrl) {
      bh += '<div class="review-field"><span class="review-label">Profile Photo</span>' +
            '<img class="review-photo" src="' + regData.photoDataUrl + '" alt="Profile"></div>';
    }
    document.getElementById('review-basic').innerHTML = bh;

    // Professional info
    var exp = regData.experience;
    if (exp) exp += (exp === '1' ? ' year' : ' years');
    var ph = rf('Specialization', regData.specialization) +
             rf('Registration Number', regData.registrationNumber) +
             rf('Experience', exp) +
             rf('Qualification', regData.qualification) +
             rf('Gender', regData.gender);
    if (regData.bio) ph += rf('Bio', regData.bio);
    document.getElementById('review-professional').innerHTML = ph;

    // Practice info
    var ptl = {
      hospital: 'Hospital', clinic: 'Clinic',
      both: 'Both Hospital & Clinic', independent: 'Independent / Solo Practice'
    };
    var prh = rf('Practice Type', ptl[regData.practiceType] || '');
    if (regData.practiceType !== 'independent' && regData.selectedFacilities.length) {
      prh += '<div class="review-field"><span class="review-label">Facilities</span><div class="review-facilities">';
      regData.selectedFacilities.forEach(function (f) {
        prh += '<div class="review-facility-item"><strong>' + esc(f.name) +
               '</strong><span>' + esc(f.type) + ' &middot; ' + esc(f.area) + '</span></div>';
      });
      prh += '</div></div>';
    }
    document.getElementById('review-practice').innerHTML = prh;
  }

  function rf(label, value) {
    return '<div class="review-field"><span class="review-label">' + esc(label) +
           '</span><span class="review-value">' + esc(value || '\u2014') + '</span></div>';
  }

  // Edit buttons
  reviewEditBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var step = parseInt(btn.getAttribute('data-step'), 10);
      editingFromReview = true;
      saveCurrentStep();
      populateStep(step);
      showStep(step);
    });
  });

  // ================================================
  // Registration Complete
  // ================================================

  function completeRegistration() {
    demoIdText.textContent = generateDemoId();

    // Expose doctor data for the dashboard
    window.DoctorLink.doctorData = {
      name: regData.name,
      photoDataUrl: regData.photoDataUrl,
      specialization: regData.specialization,
      practiceType: regData.practiceType,
      facilities: regData.selectedFacilities
    };

    regScreen.classList.remove('visible');
    regScreen.setAttribute('aria-hidden', 'true');

    regComplete.removeAttribute('aria-hidden');
    void regComplete.offsetHeight;
    regComplete.classList.add('visible');

    // Auto-transition to dashboard after a brief moment
    setTimeout(function () {
      if (typeof window.openDoctorDashboard === 'function') {
        regComplete.classList.remove('visible');
        regComplete.setAttribute('aria-hidden', 'true');
        window.openDoctorDashboard(window.DoctorLink.doctorData);
      }
    }, 2500);
  }

  function generateDemoId() {
    var c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var id = '';
    for (var i = 0; i < 6; i++) id += c.charAt(Math.floor(Math.random() * c.length));
    return 'DL-DEMO-' + id;
  }

  // Copy ID
  if (copyIdBtn) {
    copyIdBtn.addEventListener('click', function () {
      var text = demoIdText.textContent;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () {
          copyLabel.textContent = 'Copied!';
          setTimeout(function () { copyLabel.textContent = 'Copy'; }, 2000);
        });
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        copyLabel.textContent = 'Copied!';
        setTimeout(function () { copyLabel.textContent = 'Copy'; }, 2000);
      }
    });
  }

})();
