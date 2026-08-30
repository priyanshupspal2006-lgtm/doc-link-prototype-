/* ============================================
   Doctor Link — Patient Discovery Logic
   ============================================ */

(function () {
  'use strict';

  // ================================================
  // Mock Data
  // ================================================

  var FACILITIES = [
    { id: "FAC-001", name: "District Hospital, Sri Ganganagar", type: "Hospital", address: "Suratgarh Road", locality: "Sri Ganganagar", contact: "0154-2470XXX", hours: "24/7", services: "General, Emergency, Surgery", available: true },
    { id: "FAC-002", name: "Dr. S. S. Tantia Memorial Hospital", type: "Hospital", address: "Hanumangarh Road", locality: "Sri Ganganagar", contact: "0154-2471XXX", hours: "24/7", services: "General, Emergency, ICU, Maternity", available: true },
    { id: "FAC-003", name: "Tantia General Hospital", type: "Hospital", address: "Hanumangarh Road", locality: "Sri Ganganagar", contact: "0154-2472XXX", hours: "24/7", services: "General, Pediatric, Neurology", available: true },
    { id: "FAC-004", name: "Gangaram Bansal Superspeciality Hospital", type: "Hospital", address: "Gagan Path", locality: "Sri Ganganagar", contact: "0154-2473XXX", hours: "24/7", services: "Cardiology, Gastroenterology, Pulmonology", available: true },
    { id: "FAC-005", name: "Rainbow Hospital", type: "Hospital", address: "Suratgarh Road", locality: "Sri Ganganagar", contact: "0154-2474XXX", hours: "24/7", services: "Pediatrics, Neonatology", available: true },
    { id: "FAC-006", name: "S.N. Super Speciality Hospital", type: "Hospital", address: "Jawahar Nagar", locality: "Sri Ganganagar", contact: "0154-2475XXX", hours: "24/7", services: "Orthopedics, Joint Replacement", available: true },
    { id: "FAC-007", name: "Nagpal Kidney & Super Speciality Hospital", type: "Hospital", address: "Sukhadia Circle", locality: "Sri Ganganagar", contact: "0154-2476XXX", hours: "24/7", services: "Nephrology, Urology, Dialysis", available: true },
    { id: "FAC-008", name: "Aastha Kidney & General Hospital", type: "Hospital", address: "Sukhadaia Marg", locality: "Sri Ganganagar", contact: "0154-2477XXX", hours: "24/7", services: "Nephrology, General Surgery", available: false },
    { id: "FAC-009", name: "Jindal ENT Hospital & Medical Research Centre", type: "Hospital", address: "Meera Marg", locality: "Sri Ganganagar", contact: "0154-2478XXX", hours: "9:00 AM - 8:00 PM", services: "ENT, Head & Neck Surgery", available: true },
    { id: "FAC-010", name: "Sri Jagdamba Charitable Eye Hospital", type: "Hospital", address: "Padampur Road", locality: "Sri Ganganagar", contact: "0154-2479XXX", hours: "8:00 AM - 4:00 PM", services: "Ophthalmology, Cataract Surgery", available: true },
    { id: "FAC-011", name: "Bahl Hospital", type: "Hospital", address: "Purani Abadi", locality: "Sri Ganganagar", contact: "0154-2480XXX", hours: "24/7", services: "Orthopedics, General Medicine", available: true },
    { id: "FAC-012", name: "Periwal Nursing Home", type: "Hospital / Nursing Home", address: "Jawahar Nagar", locality: "Sri Ganganagar", contact: "0154-2481XXX", hours: "24/7", services: "Gynecology, Obstetrics", available: true },
    { id: "FAC-013", name: "Shri Om Sai Multispeciality Hospital", type: "Hospital", address: "Suratgarh Road", locality: "Sri Ganganagar", contact: "0154-2482XXX", hours: "24/7", services: "Multispeciality, Emergency", available: false },
    { id: "FAC-014", name: "Shree Amba Hospital", type: "Hospital", address: "G-Block", locality: "Sri Ganganagar", contact: "0154-2483XXX", hours: "24/7", services: "General Medicine, Surgery", available: true },
    { id: "FAC-015", name: "Sihag Healthcare Foundation", type: "Healthcare Facility", address: "Jawahar Nagar", locality: "Sri Ganganagar", contact: "0154-2484XXX", hours: "9:00 AM - 9:00 PM", services: "Primary Care, Diagnostics", available: true },
    { id: "FAC-016", name: "My Skin Cure", type: "Clinic", address: "Mukherjee Nagar", locality: "Sri Ganganagar", contact: "0154-2485XXX", hours: "10:00 AM - 7:00 PM", services: "Dermatology, Cosmetology", available: true },
    { id: "FAC-017", name: "Kayakalp Skin Clinic", type: "Clinic", address: "Jawahar Nagar", locality: "Sri Ganganagar", contact: "0154-2486XXX", hours: "10:00 AM - 8:00 PM", services: "Dermatology, Laser Therapy", available: true },
    { id: "FAC-018", name: "Dr. Eity's Dental & Cosmetic Center", type: "Clinic", address: "Vinoba Basti", locality: "Sri Ganganagar", contact: "0154-2487XXX", hours: "10:00 AM - 8:00 PM", services: "Dentistry, Implants", available: true },
    { id: "FAC-019", name: "Sri Guru Harkrishan Homoeopathic Clinic", type: "Clinic", address: "Sadar Bazar", locality: "Sri Ganganagar", contact: "0154-2488XXX", hours: "9:00 AM - 8:00 PM", services: "Homoeopathy", available: false },
    { id: "FAC-020", name: "Sukhija Hospital", type: "Hospital", address: "Meera Marg", locality: "Sri Ganganagar", contact: "0154-2489XXX", hours: "24/7", services: "General, Orthopedics", available: true }
  ];

  var DOCTORS = [
    { id: "DL-DEMO-1001", name: "Dr. Aarav Mehta", specialization: "General Physician", experience: "8 years", qualification: "MBBS, MD", practiceType: "Private", facilityId: "FAC-002", bio: "Experienced general physician focused on preventive care." },
    { id: "DL-DEMO-1002", name: "Dr. Priya Sharma", specialization: "Cardiologist", experience: "12 years", qualification: "MBBS, MD, DM", practiceType: "Hospital", facilityId: "FAC-004", bio: "Senior cardiologist with expertise in interventional cardiology." },
    { id: "DL-DEMO-1003", name: "Dr. Rohan Verma", specialization: "Dermatologist", experience: "5 years", qualification: "MBBS, MD", practiceType: "Clinic", facilityId: "FAC-016", bio: "Specialist in cosmetic and clinical dermatology." },
    { id: "DL-DEMO-1004", name: "Dr. Anjali Gupta", specialization: "Pediatrician", experience: "10 years", qualification: "MBBS, MD", practiceType: "Hospital", facilityId: "FAC-005", bio: "Compassionate pediatrician dedicated to child wellness." },
    { id: "DL-DEMO-1005", name: "Dr. Vikram Singh", specialization: "Orthopedic", experience: "15 years", qualification: "MBBS, MS", practiceType: "Hospital", facilityId: "FAC-006", bio: "Expert in joint replacement and trauma surgery." },
    { id: "DL-DEMO-1006", name: "Dr. Neha Patel", specialization: "Gynecologist", experience: "9 years", qualification: "MBBS, MS", practiceType: "Hospital", facilityId: "FAC-001", bio: "Focuses on maternal health and minimally invasive surgery." },
    { id: "DL-DEMO-1007", name: "Dr. Sanjay Jindal", specialization: "ENT Specialist", experience: "20 years", qualification: "MBBS, MS", practiceType: "Hospital", facilityId: "FAC-009", bio: "Leading ENT surgeon in the region." },
    { id: "DL-DEMO-1008", name: "Dr. Meera Agarwal", specialization: "Ophthalmologist", experience: "11 years", qualification: "MBBS, MS", practiceType: "Hospital", facilityId: "FAC-010", bio: "Specializes in cataract and refractive surgery." },
    { id: "DL-DEMO-1009", name: "Dr. Kabir Das", specialization: "Dentist", experience: "6 years", qualification: "BDS, MDS", practiceType: "Clinic", facilityId: "FAC-018", bio: "Expert in cosmetic dentistry and implants." },
    { id: "DL-DEMO-1010", name: "Dr. Sneha Roy", specialization: "Psychiatrist", experience: "14 years", qualification: "MBBS, MD", practiceType: "Hospital", facilityId: "FAC-003", bio: "Specializes in adult psychiatry and cognitive behavioral therapy." },
    { id: "DL-DEMO-1011", name: "Dr. Amit Nagpal", specialization: "Nephrologist", experience: "18 years", qualification: "MBBS, MD, DM", practiceType: "Hospital", facilityId: "FAC-007", bio: "Renowned expert in kidney diseases and dialysis." },
    { id: "DL-DEMO-1012", name: "Dr. Pooja Joshi", specialization: "Gastroenterologist", experience: "13 years", qualification: "MBBS, MD, DM", practiceType: "Hospital", facilityId: "FAC-004", bio: "Specializes in advanced endoscopy and liver diseases." },
    { id: "DL-DEMO-1013", name: "Dr. Rajesh Bansal", specialization: "Pulmonologist", experience: "16 years", qualification: "MBBS, MD", practiceType: "Hospital", facilityId: "FAC-004", bio: "Expert in asthma and COPD management." },
    { id: "DL-DEMO-1014", name: "Dr. Sunita Reddy", specialization: "Neurologist", experience: "10 years", qualification: "MBBS, MD, DM", practiceType: "Hospital", facilityId: "FAC-003", bio: "Specializes in stroke management and epilepsy." },
    { id: "DL-DEMO-1015", name: "Dr. Karan Aastha", specialization: "Urologist", experience: "9 years", qualification: "MBBS, MS, MCh", practiceType: "Hospital", facilityId: "FAC-008", bio: "Expert in minimally invasive urology." },
    { id: "DL-DEMO-1016", name: "Dr. Ritu Periwal", specialization: "Gynecologist", experience: "12 years", qualification: "MBBS, MD", practiceType: "Hospital", facilityId: "FAC-012", bio: "Comprehensive women's healthcare provider." },
    { id: "DL-DEMO-1017", name: "Dr. Manish Sihag", specialization: "General Physician", experience: "7 years", qualification: "MBBS, DNB", practiceType: "Clinic", facilityId: "FAC-015", bio: "Primary care physician with a holistic approach." },
    { id: "DL-DEMO-1018", name: "Dr. Anand Bahl", specialization: "Orthopedic", experience: "22 years", qualification: "MBBS, MS", practiceType: "Hospital", facilityId: "FAC-011", bio: "Senior orthopedic consultant." },
    { id: "DL-DEMO-1019", name: "Dr. Kavita Skin", specialization: "Dermatologist", experience: "4 years", qualification: "MBBS, MD", practiceType: "Clinic", facilityId: "FAC-017", bio: "Expert in acne treatment and laser therapy." },
    { id: "DL-DEMO-1020", name: "Dr. Harkrishan Singh", specialization: "General Physician", experience: "30 years", qualification: "BHMS", practiceType: "Clinic", facilityId: "FAC-019", bio: "Senior homoeopathic practitioner." }
  ];

  window.DOCTORS = DOCTORS;
  window.FACILITIES = FACILITIES;

  // Helper to find facility by ID
  function getFacility(facId) {
    return FACILITIES.find(f => f.id === facId) || { name: "Unknown Facility", type: "Unknown" };
  }

  // ================================================
  // DOM References
  // ================================================

  // Find Doctor Screen
  var findDoctorScreen = document.getElementById('pat-find-doctor');
  var fdBackBtn = document.getElementById('fd-back-btn');
  var fdSearch = document.getElementById('fd-search');
  var fdList = document.getElementById('fd-list');
  var fdEmpty = document.getElementById('fd-empty');
  var fdFilterBtns = document.querySelectorAll('#pat-find-doctor .disc-filter-btn');

  // Find Facility Screen
  var findFacScreen = document.getElementById('pat-find-facility');
  var ffBackBtn = document.getElementById('ff-back-btn');
  var ffSearch = document.getElementById('ff-search');
  var ffFilterBtns = document.querySelectorAll('#pat-find-facility .disc-filter-btn');
  var ffList = document.getElementById('ff-list');
  var ffEmpty = document.getElementById('ff-empty');

  // Facility Details Screen
  var facDetailScreen = document.getElementById('pat-facility-details');
  var detailBackBtn = document.getElementById('detail-back-btn');
  var detailType = document.getElementById('detail-type');
  var detailName = document.getElementById('detail-name');
  var detailLoc = document.getElementById('detail-loc');

  // Doctor Profile Screen
  var docProfileScreen = document.getElementById('pat-doctor-profile');
  var docBackBtn = document.getElementById('doc-profile-back-btn');
  
  // Global Search Screen
  var globalSearchScreen = document.getElementById('pat-global-search');
  var gsBackBtn = document.getElementById('gs-back-btn');
  var gsSearch = document.getElementById('gs-search-input');
  var gsResults = document.getElementById('gs-results');
  var gsEmpty = document.getElementById('gs-empty');
  var dashboardSearchInputs = document.querySelectorAll('.dash-search-input');

  // State
  var currentFdFilter = 'All';
  var currentFfFilter = 'All';

  // ================================================
  // Open / Close Helpers
  // ================================================

  function showScreen(screen) {
    if (typeof window.DoctorLink !== 'object') window.DoctorLink = {};
    if (!window.DoctorLink.screenZIndex) window.DoctorLink.screenZIndex = 50;
    screen.style.zIndex = window.DoctorLink.screenZIndex++;
    screen.removeAttribute('aria-hidden');
    void screen.offsetHeight;
    screen.classList.add('visible');
  }

  function hideScreen(screen) {
    screen.classList.remove('visible');
    screen.setAttribute('aria-hidden', 'true');
  }

  // ================================================
  // Find Doctor
  // ================================================

  window.openFindDoctor = function () {
    if (fdSearch) fdSearch.value = '';
    currentFdFilter = 'All';
    updateFdFilterUI();
    renderDoctors();
    showScreen(findDoctorScreen);
  };

  if (fdBackBtn) {
    fdBackBtn.addEventListener('click', function () {
      hideScreen(findDoctorScreen);
    });
  }

  if (fdSearch) {
    fdSearch.addEventListener('input', renderDoctors);
  }

  fdFilterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentFdFilter = btn.getAttribute('data-filter');
      updateFdFilterUI();
      renderDoctors();
    });
  });

  function updateFdFilterUI() {
    fdFilterBtns.forEach(function (btn) {
      if (btn.getAttribute('data-filter') === currentFdFilter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function renderDoctors() {
    var query = (fdSearch.value || '').toLowerCase().trim();
    
    var filtered = DOCTORS.filter(function (doc) {
      // Apply Filter
      var matchFilter = true;
      if (currentFdFilter !== 'All') {
        matchFilter = doc.specialization === currentFdFilter;
      }

      // Apply Search
      var matchSearch = true;
      if (query) {
        var fac = getFacility(doc.facilityId);
        matchSearch = doc.name.toLowerCase().includes(query) || 
                      doc.specialization.toLowerCase().includes(query) ||
                      fac.name.toLowerCase().includes(query) ||
                      doc.id.toLowerCase().includes(query);
      }

      return matchFilter && matchSearch;
    });

    fdList.innerHTML = '';

    if (filtered.length === 0) {
      fdList.style.display = 'none';
      fdEmpty.style.display = 'block';
    } else {
      fdEmpty.style.display = 'none';
      fdList.style.display = 'flex';
      
      filtered.forEach(function (doc) {
        var fac = getFacility(doc.facilityId);
        var card = document.createElement('button');
        card.className = 'disc-card';
        card.innerHTML = `
          <div class="disc-card-subtitle" style="color: var(--color-accent-dark);">${doc.specialization}</div>
          <div class="disc-card-title">${doc.name}</div>
          <div class="disc-card-subinfo">${doc.experience} • ${doc.qualification}</div>
          <div class="disc-card-loc" style="margin-top: 4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 21v-4h6v4"/><path d="M12 7v4m-2-2h4"/>
            </svg>
            ${fac.name}
          </div>
          <div class="disc-card-loc">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            Sri Ganganagar
          </div>
          <div class="disc-card-cta">View Profile &rarr;</div>
        `;
        card.addEventListener('click', function () {
          openDoctorProfile(doc);
        });
        fdList.appendChild(card);
      });
    }
  }

  // ================================================
  // Doctor Profile Screen
  // ================================================

  window.openDoctorProfile = openDoctorProfile;
  function openDoctorProfile(doc) {
    var fac = getFacility(doc.facilityId);
    
    document.getElementById('doc-prof-name').textContent = doc.name;
    document.getElementById('doc-prof-spec').textContent = doc.specialization;
    document.getElementById('doc-prof-qual').textContent = doc.qualification;
    document.getElementById('doc-prof-exp').textContent = doc.experience;
    document.getElementById('doc-prof-prac').textContent = doc.practiceType;
    document.getElementById('doc-prof-fac').textContent = fac.name;
    document.getElementById('doc-prof-id').textContent = doc.id;
    document.getElementById('doc-prof-bio').textContent = doc.bio;

    var facBtn = document.getElementById('doc-prof-fac-btn');
    var facBtnClone = facBtn.cloneNode(true);
    facBtn.parentNode.replaceChild(facBtnClone, facBtn);
    
    facBtnClone.addEventListener('click', function() {
      openFacilityDetails(fac);
    });

    var bookBtn = document.getElementById('doc-prof-book-btn');
    var bookBtnClone = bookBtn.cloneNode(true);
    bookBtn.parentNode.replaceChild(bookBtnClone, bookBtn);

    bookBtnClone.addEventListener('click', function() {
      if (typeof window.openBookingScreen === 'function') {
        window.openBookingScreen(doc);
      }
    });

    showScreen(docProfileScreen);
  }

  if (docBackBtn) {
    docBackBtn.addEventListener('click', function () {
      hideScreen(docProfileScreen);
    });
  }

  // ================================================
  // Find Facility
  // ================================================

  window.openFindFacility = function () {
    if (ffSearch) ffSearch.value = '';
    currentFfFilter = 'All';
    updateFfFilterUI();
    renderFacilities();
    showScreen(findFacScreen);
  };

  if (ffBackBtn) {
    ffBackBtn.addEventListener('click', function () {
      hideScreen(findFacScreen);
    });
  }

  if (ffSearch) {
    ffSearch.addEventListener('input', renderFacilities);
  }

  ffFilterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentFfFilter = btn.getAttribute('data-filter');
      updateFfFilterUI();
      renderFacilities();
    });
  });

  function updateFfFilterUI() {
    ffFilterBtns.forEach(function (btn) {
      if (btn.getAttribute('data-filter') === currentFfFilter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function renderFacilities() {
    var query = (ffSearch.value || '').toLowerCase().trim();
    
    var filtered = FACILITIES.filter(function (fac) {
      // Apply Filter
      var matchFilter = true;
      if (currentFfFilter === 'Hospitals') {
        matchFilter = fac.type.toLowerCase().includes('hospital');
      } else if (currentFfFilter === 'Clinics') {
        matchFilter = fac.type.toLowerCase().includes('clinic');
      }

      // Apply Search
      var matchSearch = true;
      if (query) {
        matchSearch = fac.name.toLowerCase().includes(query) || 
                      fac.type.toLowerCase().includes(query);
      }

      return matchFilter && matchSearch;
    });

    ffList.innerHTML = '';

    if (filtered.length === 0) {
      ffList.style.display = 'none';
      ffEmpty.style.display = 'block';
    } else {
      ffEmpty.style.display = 'none';
      ffList.style.display = 'flex';
      
      filtered.forEach(function (fac) {
        var card = document.createElement('button');
        card.className = 'disc-card';
        card.innerHTML = `
          <div class="disc-card-subtitle">${fac.type}</div>
          <div class="disc-card-title">${fac.name}</div>
          <div class="disc-card-loc">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Sri Ganganagar
          </div>
          <div class="disc-card-cta">View Details &rarr;</div>
        `;
        card.addEventListener('click', function () {
          openFacilityDetails(fac);
        });
        ffList.appendChild(card);
      });
    }
  }

  // ================================================
  // Facility Details
  // ================================================

  var detailAddress = document.getElementById('detail-address');
  var detailContact = document.getElementById('detail-contact');
  var detailHours = document.getElementById('detail-hours');
  var detailServices = document.getElementById('detail-services');
  var detailAppointmentsStatus = document.getElementById('detail-appointments-status');
  var detailDoctorsList = document.getElementById('detail-doctors-list');
  var detailNoDoctors = document.getElementById('detail-no-doctors');
  var detailBookBtn = document.getElementById('detail-book-btn');
  var detailViewDoctorsBtn = document.getElementById('detail-view-doctors-btn');
  var detailDoctorsSection = document.getElementById('detail-doctors-section');

  window.openFacilityDetails = openFacilityDetails;
  function openFacilityDetails(fac) {
    detailType.textContent = fac.type || 'Facility';
    detailName.textContent = fac.name;
    detailLoc.textContent = 'Sri Ganganagar';
    
    // About
    detailAddress.textContent = (fac.address ? fac.address + ', ' : '') + (fac.locality || 'Sri Ganganagar');
    detailContact.textContent = fac.contact || 'Information coming soon';
    detailHours.textContent = fac.hours || 'Information coming soon';
    
    // Services
    detailServices.textContent = fac.services || 'Information coming soon';
    
    // Appointments Status
    detailAppointmentsStatus.textContent = fac.available ? 'Appointments available' : 'No appointments available';
    detailAppointmentsStatus.style.color = fac.available ? 'var(--color-success)' : 'var(--color-error)';

    // Doctors at this facility
    detailDoctorsList.innerHTML = '';
    var facDoctors = DOCTORS.filter(function(d) { return d.facilityId === fac.id; });
    
    if (facDoctors.length === 0) {
      detailDoctorsList.style.display = 'none';
      detailNoDoctors.style.display = 'block';
    } else {
      detailNoDoctors.style.display = 'none';
      detailDoctorsList.style.display = 'flex';
      facDoctors.forEach(function(doc) {
        var card = document.createElement('button');
        card.className = 'disc-card';
        card.style.border = '1px solid var(--color-border)';
        card.style.boxShadow = 'none';
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div style="text-align:left;">
              <div class="disc-card-title">${doc.name}</div>
              <div class="disc-card-subtitle" style="color:var(--color-accent-dark);">${doc.specialization}</div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-text-muted)"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        `;
        card.addEventListener('click', function() {
          openDoctorProfile(doc);
        });
        detailDoctorsList.appendChild(card);
      });
    }

    // Book Button clone to remove old listeners
    var bookBtnClone = detailBookBtn.cloneNode(true);
    detailBookBtn.parentNode.replaceChild(bookBtnClone, detailBookBtn);
    detailBookBtn = bookBtnClone;
    detailBookBtn.addEventListener('click', function() {
      if (typeof showToast === 'function') {
        showToast('Please select a doctor to book an appointment');
      }
    });

    // View Doctors Button clone
    if (detailViewDoctorsBtn) {
      var viewDocClone = detailViewDoctorsBtn.cloneNode(true);
      detailViewDoctorsBtn.parentNode.replaceChild(viewDocClone, detailViewDoctorsBtn);
      detailViewDoctorsBtn = viewDocClone;
      detailViewDoctorsBtn.addEventListener('click', function() {
        if (detailDoctorsSection) {
          detailDoctorsSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    showScreen(facDetailScreen);
  }

  if (detailBackBtn) {
    detailBackBtn.addEventListener('click', function () {
      hideScreen(facDetailScreen);
    });
  }

  // ================================================
  // Global Search
  // ================================================

  window.openGlobalSearch = function () {
    if (gsSearch) {
      gsSearch.value = '';
      renderGlobalSearch();
    }
    showScreen(globalSearchScreen);
    setTimeout(function() {
      if (gsSearch) gsSearch.focus();
    }, 100);
  };

  dashboardSearchInputs.forEach(function(input) {
    input.addEventListener('focus', function(e) {
      e.preventDefault();
      input.blur();
      window.openGlobalSearch();
    });
  });

  if (gsBackBtn) {
    gsBackBtn.addEventListener('click', function () {
      hideScreen(globalSearchScreen);
    });
  }

  if (gsSearch) {
    gsSearch.addEventListener('input', renderGlobalSearch);
  }

  function renderGlobalSearch() {
    var query = (gsSearch.value || '').toLowerCase().trim();
    
    gsResults.innerHTML = '';

    if (!query) {
      gsResults.style.display = 'none';
      gsEmpty.style.display = 'block';
      gsEmpty.querySelector('.disc-empty-title').textContent = "Search Doctor Link";
      gsEmpty.querySelector('.disc-empty-desc').textContent = "Find doctors, specialties, hospitals, or clinics.";
      return;
    }

    var docMatches = DOCTORS.filter(function(doc) {
      var fac = getFacility(doc.facilityId);
      return doc.name.toLowerCase().includes(query) || 
             doc.specialization.toLowerCase().includes(query) ||
             doc.id.toLowerCase().includes(query) ||
             fac.name.toLowerCase().includes(query);
    });

    var facMatches = FACILITIES.filter(function(fac) {
      return fac.name.toLowerCase().includes(query) || 
             fac.type.toLowerCase().includes(query);
    });

    if (docMatches.length === 0 && facMatches.length === 0) {
      gsResults.style.display = 'none';
      gsEmpty.style.display = 'block';
      gsEmpty.querySelector('.disc-empty-title').textContent = "No results found";
      gsEmpty.querySelector('.disc-empty-desc').textContent = "Try searching for a doctor, specialty, hospital or clinic.";
    } else {
      gsEmpty.style.display = 'none';
      gsResults.style.display = 'flex';
      
      if (docMatches.length > 0) {
        var docHeader = document.createElement('h3');
        docHeader.className = 'gs-section-title';
        docHeader.textContent = 'DOCTORS';
        gsResults.appendChild(docHeader);

        docMatches.forEach(function(doc) {
          var fac = getFacility(doc.facilityId);
          var card = document.createElement('button');
          card.className = 'disc-card';
          card.innerHTML = `
            <div class="disc-card-subtitle" style="color: var(--color-accent-dark);">${doc.specialization}</div>
            <div class="disc-card-title">${doc.name}</div>
            <div class="disc-card-loc">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 21v-4h6v4"/><path d="M12 7v4m-2-2h4"/>
              </svg>
              ${fac.name}
            </div>
          `;
          card.addEventListener('click', function() {
            openDoctorProfile(doc);
          });
          gsResults.appendChild(card);
        });
      }

      if (facMatches.length > 0) {
        var facHeader = document.createElement('h3');
        facHeader.className = 'gs-section-title';
        facHeader.style.marginTop = 'var(--space-md)';
        facHeader.textContent = 'HOSPITALS & CLINICS';
        gsResults.appendChild(facHeader);

        facMatches.forEach(function(fac) {
          var card = document.createElement('button');
          card.className = 'disc-card';
          card.innerHTML = `
            <div class="disc-card-subtitle">${fac.type}</div>
            <div class="disc-card-title">${fac.name}</div>
          `;
          card.addEventListener('click', function() {
            openFacilityDetails(fac);
          });
          gsResults.appendChild(card);
        });
      }
    }
  }

  // (Booking modal logic moved to patient-booking.js)

})();
