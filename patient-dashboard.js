/* ============================================
   Doctor Link — Patient Dashboard Logic
   ============================================ */

(function () {
  
  // ================================================
  // Centralized Datetime Utilities
  // ================================================
  window.DoctorLinkUtils = window.DoctorLinkUtils || {
    toISODate: function(d) {
      var yyyy = d.getFullYear();
      var mm = d.getMonth() + 1;
      var dd = d.getDate();
      if(mm < 10) mm = '0'+mm;
      if(dd < 10) dd = '0'+dd;
      return yyyy + '-' + mm + '-' + dd;
    },

    normalizeDateString: function(str) {
      if (!str) return this.toISODate(new Date());
      if (str.match(/^\d{4}-\d{2}-\d{2}$/)) return str;
      
      var d = new Date();
      if (str === 'Today') {
        return this.toISODate(d);
      } else if (str === 'Tomorrow') {
        d.setDate(d.getDate() + 1);
        return this.toISODate(d);
      } else if (str === 'Next available') {
        d.setDate(d.getDate() + 2);
        return this.toISODate(d);
      } else {
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var monthIndex = -1;
        var day = -1;
        
        for (var i = 0; i < months.length; i++) {
          if (str.toLowerCase().indexOf(months[i].toLowerCase()) !== -1) {
            monthIndex = i;
            break;
          }
        }
        
        var dayMatch = str.match(/\b(\d{1,2})\b/);
        if (dayMatch) {
           day = parseInt(dayMatch[1], 10);
        }
        
        if (monthIndex !== -1 && day !== -1) {
           var parsed = new Date(d.getFullYear(), monthIndex, day);
           var todayZero = new Date(d.getFullYear(), d.getMonth(), d.getDate());
           if (parsed < todayZero) {
             parsed.setFullYear(parsed.getFullYear() + 1);
           }
           return this.toISODate(parsed);
        }
        
        // Final fallback if native works? Better not rely on it.
        return this.toISODate(d);
      }
    },

    formatDateForUI: function(isoStr) {
      if (!isoStr) return '';
      if (!isoStr.match(/^\d{4}-\d{2}-\d{2}$/)) return isoStr; 
      
      var parts = isoStr.split('-');
      var d = new Date(parseInt(parts[0],10), parseInt(parts[1],10)-1, parseInt(parts[2],10));
      
      var now = new Date();
      var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      var tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      
      if (d.getTime() === today.getTime()) return 'Today';
      if (d.getTime() === tomorrow.getTime()) return 'Tomorrow';
      
      var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate();
    },

    parseAppointmentDateTime: function(isoDateStr, timeStr) {
      var norm = this.normalizeDateString(isoDateStr);
      var parts = norm.split('-');
      var d = new Date(parseInt(parts[0],10), parseInt(parts[1],10)-1, parseInt(parts[2],10));
      
      var match = (timeStr || '').match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        var hours = parseInt(match[1], 10);
        var minutes = parseInt(match[2], 10);
        var ampm = match[3].toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        d.setHours(hours, minutes, 0, 0);
      } else {
        d.setHours(0,0,0,0);
      }
      return d;
    },

    initQueueData: function(apt) {
      if (typeof apt.tokenNumber === 'undefined') {
        apt.tokenNumber = Math.floor(Math.random() * 20) + 10;
      }
      
      var normDate = this.normalizeDateString(apt.date);
      var todayStr = this.toISODate(new Date());

      if (normDate !== todayStr) {
        apt.trackingStatus = 'not_started';
        apt.currentToken = null;
        apt.patientsAhead = null;
        apt.estimatedWaitMinutes = null;
        apt.doctorQueueStatus = null;
        apt.doctorDelayMinutes = null;
      } else {
        if (!apt.trackingStatus || apt.trackingStatus === 'not_started') {
          apt.trackingStatus = 'waiting';
          apt.currentToken = apt.tokenNumber > 5 ? apt.tokenNumber - 5 : 1;
          apt.patientsAhead = apt.tokenNumber - apt.currentToken;
          apt.estimatedWaitMinutes = apt.patientsAhead * 5;
          apt.doctorQueueStatus = 'on_time';
          apt.doctorDelayMinutes = 0;
        }
      }
    }
  };

  'use strict';

  // ================================================
  // DOM References
  // ================================================

  var dashScreen = document.getElementById('pat-dashboard');
  var dashGreeting = document.getElementById('dash-greeting');
  var dashAvatarImg = document.getElementById('dash-avatar-img');
  var dashAvatarPlaceholder = document.getElementById('dash-avatar-placeholder');
  var dashSearchInput = document.getElementById('dash-search');
  var dashToast = document.getElementById('dash-toast');

  // Quick action buttons
  var actionBtns = dashScreen.querySelectorAll('.dash-action-card');

  // Bottom nav
  var navItems = dashScreen.querySelectorAll('.dash-nav-item');

  // CTA buttons
  var findDoctorCtaBtns = dashScreen.querySelectorAll('.dash-find-doctor-cta');

  // ================================================
  // State
  // ================================================

  var toastTimer = null;

  // ================================================
  // Entry Point — opens the patient dashboard
  // ================================================

  window.openPatientDashboard = function (patientInfo) {
    patientInfo = patientInfo || {};

    // Greeting — time-based
    var name = patientInfo.name || '';
    var firstName = name.split(' ')[0] || '';
    var greeting = getGreeting();

    if (firstName) {
      dashGreeting.textContent = greeting + ', ' + firstName;
    } else {
      dashGreeting.textContent = greeting;
    }

    // Avatar
    updateDashAvatar(patientInfo.photoDataUrl, firstName);

    // Reset search
    if (dashSearchInput) dashSearchInput.value = '';

    // Reset nav state
    navItems.forEach(function (item) {
      item.classList.toggle('active', item.getAttribute('data-nav') === 'home');
    });

    if (typeof window.renderDashboardHome === 'function') window.renderDashboardHome();

    // Show the dashboard
    dashScreen.removeAttribute('aria-hidden');
    void dashScreen.offsetHeight;
    dashScreen.classList.add('visible');
  };

  // ================================================
  // Greeting Helper
  // ================================================

  function getGreeting() {
    var hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  // ================================================
  // Avatar
  // ================================================

  function updateDashAvatar(photoUrl, firstName) {
    if (photoUrl) {
      dashAvatarImg.src = photoUrl;
      dashAvatarImg.style.display = 'block';
      dashAvatarPlaceholder.style.display = 'none';
    } else {
      dashAvatarImg.style.display = 'none';
      dashAvatarPlaceholder.style.display = 'flex';
      // Show first letter of name or a generic icon
      var initial = firstName ? firstName.charAt(0).toUpperCase() : '';
      dashAvatarPlaceholder.textContent = initial || '';
      if (!initial) {
        dashAvatarPlaceholder.innerHTML =
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
      }
    }
  }

  // ================================================
  // Toast ("Coming next")
  // ================================================

  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    dashToast.textContent = message;
    dashToast.classList.add('show');
    toastTimer = setTimeout(function () {
      dashToast.classList.remove('show');
      toastTimer = null;
    }, 2000);
  }

  // ================================================
  // Quick Actions
  // ================================================

  actionBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var action = btn.getAttribute('data-action');
      if (action === 'Find a Doctor' && typeof window.openFindDoctor === 'function') {
        window.openFindDoctor();
      } else if (action === 'Find a Hospital / Clinic' && typeof window.openFindFacility === 'function') {
        window.openFindFacility();
      } else if (action === 'My Appointments' && typeof openMyAppointments === 'function') {
        openMyAppointments();
      } else if (action === 'My Profile' && typeof openMyProfile === 'function') {
        openMyProfile();
      } else {
        showToast('Coming next — ' + (action || 'Feature'));
      }
    });
  });

  // ================================================
  // Find Doctor CTA buttons
  // ================================================

  findDoctorCtaBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (typeof window.openFindDoctor === 'function') {
        window.openFindDoctor();
      } else {
        showToast('Coming next — Find a Doctor');
      }
    });
  });

  // ================================================
  // Screens logic: My Appointments & My Profile
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

  var myAppointmentsScreen = document.getElementById('pat-my-appointments');
  var appointmentsBackBtn = document.getElementById('appointments-back-btn');
  var appointmentsFindDocBtn = document.getElementById('appointments-find-doc-btn');

  function openMyAppointments() {
    if (typeof window.renderMyAppointments === 'function') {
      window.renderMyAppointments();
    }
    showScreen(myAppointmentsScreen);
  }
  
  if (appointmentsBackBtn) {
    appointmentsBackBtn.addEventListener('click', function() { hideScreen(myAppointmentsScreen); });
  }
  
  if (appointmentsFindDocBtn) {
    appointmentsFindDocBtn.addEventListener('click', function() {
      hideScreen(myAppointmentsScreen);
      if (typeof window.openFindDoctor === 'function') window.openFindDoctor();
    });
  }

  var myProfileScreen = document.getElementById('pat-my-profile');
  var profileBackBtn = document.getElementById('profile-back-btn');
  var editProfileBtn = document.getElementById('profile-edit-btn');
  var logoutBtn = document.getElementById('profile-logout-btn');

  function openMyProfile() {
    var pData = window.DoctorLink && window.DoctorLink.patientData ? window.DoctorLink.patientData : {};
    
    document.getElementById('my-profile-name').textContent = pData.name || 'Not added';
    document.getElementById('my-profile-email').textContent = pData.email || 'Not added';
    document.getElementById('my-profile-mobile').textContent = pData.mobile || 'Not added';
    document.getElementById('my-profile-dob').textContent = pData.dob || 'Not added';
    document.getElementById('my-profile-gender').textContent = pData.gender || 'Not added';
    document.getElementById('my-profile-address').textContent = pData.address || 'Not added';
    document.getElementById('my-profile-lang').textContent = pData.lang || 'Not added';
    document.getElementById('my-profile-emerg-name').textContent = pData.emergName || 'Not added';
    document.getElementById('my-profile-emerg-phone').textContent = pData.emergPhone || 'Not added';
    
    if (pData.name) {
      document.getElementById('my-profile-initial').textContent = pData.name.charAt(0).toUpperCase();
    }
    
    if (pData.photoDataUrl) {
      document.getElementById('my-profile-img').src = pData.photoDataUrl;
      document.getElementById('my-profile-img').style.display = 'block';
      document.getElementById('my-profile-initial').style.display = 'none';
    } else {
      document.getElementById('my-profile-img').style.display = 'none';
      document.getElementById('my-profile-initial').style.display = 'block';
    }

    showScreen(myProfileScreen);
  }

  if (profileBackBtn) {
    profileBackBtn.addEventListener('click', function() { hideScreen(myProfileScreen); });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      hideScreen(myProfileScreen);
      hideScreen(dashScreen);
      var authScreen = document.getElementById('auth-screen');
      if (authScreen) {
        authScreen.removeAttribute('aria-hidden');
        authScreen.classList.add('visible');
      }
    });
  }

  var editProfileScreen = document.getElementById('pat-edit-profile');
  var editProfileBackBtn = document.getElementById('edit-profile-back-btn');
  var editProfileForm = document.getElementById('edit-profile-form');
  
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', function() {
      var pData = window.DoctorLink && window.DoctorLink.patientData ? window.DoctorLink.patientData : {};
      document.getElementById('edit-name').value = pData.name || '';
      document.getElementById('edit-mobile').value = pData.mobile || '';
      document.getElementById('edit-email').value = pData.email || '';
      document.getElementById('edit-address').value = pData.address || '';
      document.getElementById('edit-lang').value = pData.lang || '';
      document.getElementById('edit-emerg-name').value = pData.emergName || '';
      document.getElementById('edit-emerg-phone').value = pData.emergPhone || '';
      showScreen(editProfileScreen);
    });
  }
  
  if (editProfileBackBtn) {
    editProfileBackBtn.addEventListener('click', function() { hideScreen(editProfileScreen); });
  }
  
  if (editProfileForm) {
    editProfileForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      if (!window.DoctorLink) window.DoctorLink = {};
      if (!window.DoctorLink.patientData) window.DoctorLink.patientData = {};
      
      var pData = window.DoctorLink.patientData;
      pData.name = document.getElementById('edit-name').value.trim();
      pData.mobile = document.getElementById('edit-mobile').value.trim();
      pData.email = document.getElementById('edit-email').value.trim();
      pData.address = document.getElementById('edit-address').value.trim();
      pData.lang = document.getElementById('edit-lang').value.trim();
      pData.emergName = document.getElementById('edit-emerg-name').value.trim();
      pData.emergPhone = document.getElementById('edit-emerg-phone').value.trim();
      
      // Update Dashboard Name
      var firstName = (pData.name || '').split(' ')[0] || '';
      dashGreeting.textContent = getGreeting() + (firstName ? ', ' + firstName : '');
      
      hideScreen(editProfileScreen);
      openMyProfile(); // refresh profile view
    });
  }

  // ================================================
  // Bottom Navigation
  // ================================================

  navItems.forEach(function (item) {
    item.addEventListener('click', function () {
      var nav = item.getAttribute('data-nav');
      
      navItems.forEach(function (n) { n.classList.remove('active'); });
      item.classList.add('active');

      if (nav === 'home') {
        // If we were on another screen, hide them to show dashboard
        hideScreen(myAppointmentsScreen);
        hideScreen(myProfileScreen);
        if (typeof hideScreen === 'function') {
           var discScreens = document.querySelectorAll('.discovery-screen');
           discScreens.forEach(function(s) { s.classList.remove('visible'); s.setAttribute('aria-hidden', 'true'); });
        }
        if (typeof window.renderDashboardHome === 'function') window.renderDashboardHome();
        dashScreen.querySelector('.dash-main').scrollTo({ top: 0, behavior: 'smooth' });
      } else if (nav === 'appointments') {
        openMyAppointments();
      } else if (nav === 'doctors') {
        if (typeof window.openFindDoctor === 'function') window.openFindDoctor();
      } else if (nav === 'payments') {
        if (typeof window.openMyPayments === 'function') window.openMyPayments();
      } else if (nav === 'profile') {
        openMyProfile();
      }
    });
  });

  // ================================================
  // Search — UI only
  // ================================================

  // Search logic is handled in patient-discovery.js

  // ================================================
  // Notification icon
  // ================================================

  var notifBtn = document.getElementById('dash-notif-btn');
  if (notifBtn) {
    notifBtn.addEventListener('click', function () {
      showToast('Notifications coming soon');
    });
  }

  // ================================================
  // Profile avatar button
  // ================================================
  var profileAvatarBtn = document.getElementById('dash-profile-btn');
  if (profileAvatarBtn) {
    profileAvatarBtn.addEventListener('click', function () {
      if (typeof openMyProfile === 'function') {
        openMyProfile();
      }
    });
  }

  // ================================================
  // Utility
  // ================================================

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ================================================
  // Dashboard Home Rendering
  // ================================================
  
  window.CURRENT_APT_WINDOW_MINUTES = 30; // Configurable window

  window.renderDashboardHome = function() {
    var apts = window.DoctorLink.appointments || [];
    var recent = window.DoctorLink.recentActivity || [];
    
    var activeApts = apts.filter(function(a) { return a.status !== 'cancelled'; });
    
    var currentApt = null;
    var upcomingApts = [];
    var now = new Date();
    
    var todayStr = window.DoctorLinkUtils.toISODate(now);

    for (var i = 0; i < activeApts.length; i++) {
      var apt = activeApts[i];
      var normDate = window.DoctorLinkUtils.normalizeDateString(apt.date);
      var aptDateTime = window.DoctorLinkUtils.parseAppointmentDateTime(normDate, apt.time);
      apt._parsedDate = aptDateTime; // cache for sorting
      apt.date = normDate; // Safely normalize it in the main array for future
      
      if (window.DoctorLinkUtils.initQueueData) {
        window.DoctorLinkUtils.initQueueData(apt);
      }

      var isCurrent = false;
      if (normDate === todayStr) {
        if (apt.status !== 'cancelled' && apt.trackingStatus && apt.trackingStatus !== 'completed' && apt.trackingStatus !== 'cancelled' && apt.trackingStatus !== 'not_started') {
          isCurrent = true;
          if (!currentApt || aptDateTime < currentApt._parsedDate) {
             currentApt = apt;
          }
        }
      }
      
      if (!isCurrent && aptDateTime > now) {
        if (apt.status !== 'cancelled' && apt.trackingStatus !== 'completed' && apt.trackingStatus !== 'cancelled') {
           upcomingApts.push(apt);
        }
      }
    }
    
    upcomingApts.sort(function(a, b) {
       return a._parsedDate - b._parsedDate;
    });

    var nearestApt = upcomingApts.length > 0 ? upcomingApts[0] : null;
    
    // Upcoming Appointment
    var upcomingBody = document.getElementById('dash-upcoming-body');
    if (upcomingBody) {
      if (!nearestApt) {
        upcomingBody.innerHTML = `
          <div class="dash-empty-state">
            <div class="dash-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <p class="dash-empty-text">No upcoming appointments</p>
            <button type="button" class="dash-empty-cta dash-find-doctor-cta" onclick="window.openFindDoctor()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Find a Doctor
            </button>
          </div>
        `;
      } else {
        // Find doc & fac
        var doc = null; var fac = null;
        if (typeof DOCTORS !== 'undefined') {
          doc = DOCTORS.find(d => d.id === nearestApt.doctorId);
        }
        if (typeof FACILITIES !== 'undefined') {
          fac = FACILITIES.find(f => f.id === nearestApt.facilityId);
        }
        doc = doc || { name: "Unknown", specialization: "Unknown" };
        fac = fac || { name: "Unknown" };

        var statusColor = nearestApt.status === 'rescheduled' ? 'var(--color-accent)' : '#2e7d32';

        upcomingBody.innerHTML = `
          <div class="disc-card" style="margin-bottom:0; cursor:default; box-shadow:none; border:1px solid var(--color-border);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
              <div class="disc-card-title">Dr. ${doc.name}</div>
              <div style="font-size:0.75rem; font-weight:600; padding:2px 6px; border-radius:4px; background:${statusColor}; color:#fff; text-transform:capitalize;">${nearestApt.status}</div>
            </div>
            <div class="disc-card-subtitle" style="color:var(--color-accent-dark); margin-bottom:4px;">${doc.specialization}</div>
            <div class="disc-card-loc" style="margin-bottom:4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${window.DoctorLinkUtils.formatDateForUI(nearestApt.date)} at ${nearestApt.time}
            </div>
            <div class="disc-card-loc">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 21v-4h6v4"/><path d="M12 7v4m-2-2h4"/></svg>
              ${fac.name}
            </div>
            <button type="button" class="doc-prof-btn doc-prof-btn-secondary" style="margin-top:12px; width:100%;" onclick="openAptDetails('${nearestApt.appointmentId}')">View Appointment</button>
          </div>
        `;
      }
    }

    // Current Appointment
    var currentBody = document.getElementById('dash-current-body');
    if (currentBody) {
      if (!currentApt) {
        currentBody.innerHTML = `
          <div class="dash-empty-state">
            <div class="dash-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M12 9v4l2 2"/></svg>
            </div>
            <p class="dash-empty-text">No current appointment</p>
          </div>
        `;
      } else {
        var doc = null; var fac = null;
        if (typeof DOCTORS !== 'undefined') doc = DOCTORS.find(d => d.id === currentApt.doctorId);
        if (typeof FACILITIES !== 'undefined') fac = FACILITIES.find(f => f.id === currentApt.facilityId);
        doc = doc || { name: "Unknown" }; fac = fac || { name: "Unknown" };
        
        var dStatText = 'Doctor is on time';
        var dStatColor = 'var(--color-text-secondary)';
        if (currentApt.doctorQueueStatus === 'delayed') {
           dStatText = 'Doctor is running ' + (currentApt.doctorDelayMinutes || 15) + ' min late';
           dStatColor = '#d32f2f';
        }

        currentBody.innerHTML = `
          <div class="disc-card" style="margin-bottom:0; cursor:default; box-shadow:none; border:1px solid var(--color-border);">
            <div style="font-size:0.75rem; font-weight:700; color:var(--color-accent-dark); text-transform:uppercase; margin-bottom:8px;">Today's Appointment</div>
            <div class="disc-card-title" style="margin-bottom:4px;">Dr. ${doc.name}</div>
            <div class="disc-card-loc" style="margin-bottom:12px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 21v-4h6v4"/><path d="M12 7v4m-2-2h4"/></svg>
              ${fac.name}
            </div>
            
            <div style="background:var(--color-surface); border-radius:4px; padding:12px; margin-bottom:12px; border:1px solid var(--color-border);">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                 <div><strong style="font-size:0.75rem; color:var(--color-text-secondary); display:block;">Your Token</strong><span style="font-size:1.25rem; font-weight:700;">#${currentApt.tokenNumber}</span></div>
                 <div style="text-align:right;"><strong style="font-size:0.75rem; color:var(--color-text-secondary); display:block;">Now Serving</strong><span style="font-size:1.25rem; font-weight:700; color:var(--color-accent-dark);">#${currentApt.currentToken}</span></div>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:0.875rem; margin-bottom:8px;">
                 <div><strong style="color:var(--color-text-secondary);">Ahead:</strong> ${currentApt.patientsAhead}</div>
                 <div><strong style="color:var(--color-text-secondary);">Est. Wait:</strong> ~${currentApt.estimatedWaitMinutes} min</div>
              </div>
              <div style="font-size:0.875rem; font-weight:600; color:${dStatColor};">${dStatText}</div>
            </div>
            
            <div style="display:flex; gap:12px;">
              <button type="button" class="doc-prof-btn doc-prof-btn-primary" style="flex:1;" onclick="openTokenFromDashboard('${currentApt.appointmentId}')">Track Live Queue</button>
              <button type="button" class="doc-prof-btn doc-prof-btn-secondary" style="flex:1;" onclick="openAptDetails('${currentApt.appointmentId}')">Details</button>
            </div>
          </div>
        `;
      }
    }

    // Recent Activity
    var recentBody = document.getElementById('dash-recent-body');
    if (recentBody) {
      if (recent.length === 0) {
        recentBody.innerHTML = `
          <div class="dash-empty-state">
            <div class="dash-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <p class="dash-empty-text">No recent activity</p>
          </div>
        `;
      } else {
        var recentHtml = '<div style="display:flex; flex-direction:column; gap:12px;">';
        // Show up to 5 most recent
        var displayRecent = recent.slice(-5).reverse();
        displayRecent.forEach(function(act) {
          var icon = '<circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>'; // default clock
          if (act.type === 'booked') icon = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>';
          else if (act.type === 'payment') icon = '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>';
          else if (act.type === 'cancelled') icon = '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>';
          else if (act.type === 'rescheduled') icon = '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>';

          recentHtml += `
            <div style="display:flex; align-items:flex-start; gap:12px; padding:12px; border:1px solid var(--color-border); border-radius:var(--radius-sm); background:var(--color-bg);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-dark)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">${icon}</svg>
              <div>
                <div style="font-size:0.875rem; font-weight:600; color:var(--color-text);">${act.message}</div>
                <div style="font-size:0.75rem; color:var(--color-text-secondary); margin-top:2px;">${act.subtext}</div>
              </div>
            </div>
          `;
        });
        recentHtml += '</div>';
        recentBody.innerHTML = recentHtml;
      }
    }
  };

  // Helper function for the view buttons injected into HTML
  window.openAptDetails = function(aptId) {
    if (!window.DoctorLink.appointments) return;
    var apt = window.DoctorLink.appointments.find(function(a) { return a.appointmentId === aptId; });
    if (apt) {
      if (typeof window.triggerAptDetails === 'function') {
        window.triggerAptDetails(apt);
      }
    }
  };

  window.openTokenFromDashboard = function(aptId) {
    if (!window.DoctorLink.appointments) return;
    var apt = window.DoctorLink.appointments.find(function(a) { return a.appointmentId === aptId; });
    if (apt && typeof window.openTokenTracking === 'function') {
      window.openTokenTracking(apt);
    }
  };

  // ================================================
  // DEVELOPMENT / PROTOTYPE TESTING
  // ================================================
  window.createTestAppointment = function(offsetMinutes) {
    if (offsetMinutes === undefined) offsetMinutes = 0;
    var d = new Date();
    d.setMinutes(d.getMinutes() + offsetMinutes);
    
    var hours = d.getHours();
    var minutes = d.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    var timeStr = (hours < 10 ? '0' + hours : hours) + ':' + minutes + ' ' + ampm;
    
    if (!window.DoctorLink) window.DoctorLink = {};
    if (!window.DoctorLink.appointments) window.DoctorLink.appointments = [];
    
    var pData = window.DoctorLink.patientData || {id: 'PAT-DEMO-1'};
    var aptId = 'APT-TEST-' + (1000 + window.DoctorLink.appointments.length + 1);
    
    var docId = (typeof DOCTORS !== 'undefined' && DOCTORS.length > 0) ? DOCTORS[0].id : 'doc_1';
    var facId = (typeof DOCTORS !== 'undefined' && DOCTORS.length > 0) ? DOCTORS[0].facilityId : 'fac_1';
    
    var testApt = {
      appointmentId: aptId,
      patientId: pData.id,
      doctorId: docId,
      facilityId: facId,
      date: window.DoctorLinkUtils ? window.DoctorLinkUtils.normalizeDateString('Today') : 'Today',
      time: timeStr,
      status: 'confirmed',
      consultationFee: 500,
      paymentMethod: 'pay_at_visit',
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString()
    };
    
    window.DoctorLink.appointments.push(testApt);
    console.log('Created test appointment for ' + timeStr + ' (' + offsetMinutes + ' mins from now).');
    
    if (typeof window.renderDashboardHome === 'function') window.renderDashboardHome();
    if (typeof window.renderMyAppointments === 'function') window.renderMyAppointments();
    return testApt;
  };

})();
