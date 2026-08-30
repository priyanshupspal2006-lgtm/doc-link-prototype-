/* ============================================
   Doctor Link — Doctor Dashboard Logic
   ============================================ */

(function () {
  'use strict';

  // ================================================
  // DOM References
  // ================================================

  var dashScreen = document.getElementById('doc-dashboard');
  var dashGreeting = document.getElementById('doc-dash-greeting');
  var dashAvatarImg = document.getElementById('doc-dash-avatar-img');
  var dashAvatarPlaceholder = document.getElementById('doc-dash-avatar-placeholder');
  
  var statusToggle = document.getElementById('doc-status-toggle');
  var statusLabel = document.getElementById('doc-status-label');
  var statusDesc = document.getElementById('doc-status-desc');
  var statusWrap = document.getElementById('doc-status-wrap');

  var practiceTypeEl = document.getElementById('doc-practice-type');
  var practiceNameEl = document.getElementById('doc-practice-name');
  var practiceSpecEl = document.getElementById('doc-practice-spec');
  var practiceLocEl = document.getElementById('doc-practice-loc');

  var dashToast = document.getElementById('doc-dash-toast');
  var actionBtns = dashScreen.querySelectorAll('.doc-action-card');
  var navItems = dashScreen.querySelectorAll('.doc-dash-nav-item');

  // ================================================
  // State
  // ================================================

  var toastTimer = null;

  // ================================================
  // Entry Point
  // ================================================

  window.openDoctorDashboard = function (doctorData) {
    seedDoctorDemoAppointments();
    
    doctorData = doctorData || {};

    // Sync with DOCTORS array to establish ONE persistent source of truth
    if (typeof DOCTORS !== 'undefined' && DOCTORS.length > 0) {
      var doc = DOCTORS[0];
      if (doctorData.name) doc.name = doctorData.name;
      if (doctorData.photoDataUrl) doc.photoDataUrl = doctorData.photoDataUrl;
      if (doctorData.specialization) doc.specialization = doctorData.specialization;
      if (doctorData.practiceType) doc.practiceType = doctorData.practiceType;
      if (doctorData.facilities && doctorData.facilities.length > 0) {
         doc.facilities = doctorData.facilities;
      }
      
      // Now set doctorData to DOCTORS[0] to use the single source of truth
      doctorData = doc;
    }

    // Greeting
    var name = doctorData.name || '';
    // Format "Dr. Name" if not already present, otherwise just the name
    var displayName = name;
    if (name && !name.toLowerCase().startsWith('dr')) {
      displayName = 'Dr. ' + name;
    }
    
    var greeting = getGreeting();
    if (displayName) {
      dashGreeting.textContent = greeting + ', ' + displayName;
    } else {
      dashGreeting.textContent = greeting;
    }

    // Avatar
    updateAvatar(doctorData.photoDataUrl, displayName || 'Doctor');

    // Practice Info
    updatePracticeInfo(doctorData);

    // Reset status toggle to default (Closed)
    if (statusToggle) {
      statusToggle.checked = false;
      updateStatusUI();
    }

    // Reset nav state
    navItems.forEach(function (item) {
      item.classList.toggle('active', item.getAttribute('data-nav') === 'home');
    });

    // Show dashboard
    dashScreen.removeAttribute('aria-hidden');
    void dashScreen.offsetHeight;
    dashScreen.classList.add('visible');
  };

  // ================================================
  // Helpers
  // ================================================

  function getGreeting() {
    var hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function updateAvatar(photoUrl, name) {
    if (photoUrl) {
      dashAvatarImg.src = photoUrl;
      dashAvatarImg.style.display = 'block';
      dashAvatarPlaceholder.style.display = 'none';
    } else {
      dashAvatarImg.style.display = 'none';
      dashAvatarPlaceholder.style.display = 'flex';
      var initial = name ? name.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase() : '';
      dashAvatarPlaceholder.textContent = initial || 'D';
    }
  }

  function updatePracticeInfo(data) {
    // Determine practice name from facilities
    var facName = '\u2014'; // em dash
    if (data.facilities && data.facilities.length > 0) {
      facName = data.facilities[0].name;
    }

    if (practiceTypeEl) practiceTypeEl.textContent = data.practiceType || '\u2014';
    if (practiceNameEl) practiceNameEl.textContent = facName;
    if (practiceSpecEl) practiceSpecEl.textContent = data.specialization || '\u2014';
    if (practiceLocEl) practiceLocEl.textContent = 'Sri Ganganagar, Rajasthan';
  }

  function updateStatusUI() {
    if (statusToggle.checked) {
      statusLabel.textContent = 'Clinic Open';
      statusDesc.textContent = "You're currently accepting patients";
      statusWrap.classList.add('is-open');
      if (typeof docDelaySelect !== 'undefined' && docDelaySelect) docDelaySelect.style.display = 'block';
    } else {
      statusLabel.textContent = 'Clinic Closed';
      statusDesc.textContent = "You're currently not accepting patients";
      statusWrap.classList.remove('is-open');
      if (typeof docDelaySelect !== 'undefined' && docDelaySelect) {
        docDelaySelect.style.display = 'none';
        docDelaySelect.value = "0";
      }
    }
    if (typeof renderQueue === 'function') renderQueue();
  }

  // ================================================
  // Interactivity
  // ================================================

  if (statusToggle) {
    statusToggle.addEventListener('change', updateStatusUI);
  }

  var callNextBtn = document.getElementById('doc-queue-call-next');
  if (callNextBtn) {
    callNextBtn.addEventListener('click', function() {
      var currentQueue = getDoctorActiveQueue();
      var activeApts = currentQueue.filter(function(a) {
        return a.trackingStatus === 'in_consultation' || a.trackingStatus === 'called';
      });
      var currentApt = activeApts.find(a => a.trackingStatus === 'in_consultation') || (activeApts.length > 0 ? activeApts[0] : null);

      if (currentApt && currentApt.trackingStatus === 'in_consultation') {
        showToast("Complete the current consultation before calling the next patient.");
        return;
      }

      var waitingAppointments = currentQueue.filter(function(a) {
        return a.trackingStatus === 'waiting' || a.trackingStatus === 'not_started' || !a.trackingStatus;
      });

      if (waitingAppointments.length === 0) {
        showToast("No waiting patients left in queue.");
        return;
      }

      // We have an eligible next patient
      var nextApt = waitingAppointments[0];
      nextApt.trackingStatus = 'called';
      
      if (!window.DoctorLink.recentActivity) window.DoctorLink.recentActivity = [];
      window.DoctorLink.recentActivity.push({
        type: 'called', // custom type, can fallback to generic in UI
        message: 'Your turn is approaching',
        subtext: 'Token #' + nextApt.tokenNumber + ' has been called. Please proceed to the consultation area.',
        date: new Date().toISOString()
      });

      showToast("Token #" + nextApt.tokenNumber + " called.");
      
      if (typeof renderQueue === 'function') renderQueue();
      if (typeof window.renderDocAppointments === 'function') window.renderDocAppointments();
    });
  }

  var markCompletedBtn = document.getElementById('doc-queue-mark-completed');
  if (markCompletedBtn) {
    markCompletedBtn.addEventListener('click', function() {
      var currentQueue = getDoctorActiveQueue();
      var activeApts = currentQueue.filter(function(a) {
        return a.trackingStatus === 'in_consultation' || a.trackingStatus === 'called';
      });
      var currentApt = activeApts.find(a => a.trackingStatus === 'in_consultation') || (activeApts.length > 0 ? activeApts[0] : null);

      if (!currentApt) {
        showToast("No active patient to complete.");
        return;
      }

      currentApt.trackingStatus = 'completed';
      showToast("Token #" + currentApt.tokenNumber + " marked completed.");
      
      if (typeof renderQueue === 'function') renderQueue();
      if (typeof window.renderDocAppointments === 'function') window.renderDocAppointments();
    });
  }

  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    dashToast.textContent = message;
    dashToast.classList.add('show');
    toastTimer = setTimeout(function () {
      dashToast.classList.remove('show');
      toastTimer = null;
    }, 2000);
  }

  function hideAllScreens() {
    dashScreen.classList.remove('visible');
    dashScreen.setAttribute('aria-hidden', 'true');
    var screens = document.querySelectorAll('.discovery-screen');
    screens.forEach(function(s) {
      s.classList.remove('visible');
      s.setAttribute('aria-hidden', 'true');
    });
  }

  function showDocScreen(id) {
    var s = document.getElementById(id);
    if (s) {
      s.removeAttribute('aria-hidden');
      void s.offsetHeight;
      s.classList.add('visible');
      s.querySelector('.disc-scroll-content').scrollTo({ top: 0 });
    }
  }

  actionBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var action = btn.getAttribute('data-action');
      if (action === "Today's Appointments" || action === "Appointments") {
        hideAllScreens();
        if (typeof window.renderDocAppointments === 'function') window.renderDocAppointments();
        showDocScreen('doc-appointments-screen');
      } else if (action === "Patient Queue" || action === "Queue") {
        var queueEl = document.getElementById('doc-queue-body');
        if (queueEl) queueEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (action === "My Practice" || action === "Practice") {
        var practiceEl = document.getElementById('doc-practice-spec');
        if (practiceEl) practiceEl.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (action === "My Profile" || action === "Profile") {
        hideAllScreens();
        if (typeof window.renderDocProfile === 'function') window.renderDocProfile();
        showDocScreen('doc-profile-screen');
      } else {
        showToast('Coming next - ' + (action || 'Feature'));
      }
    });
  });

  navItems.forEach(function (item) {
    item.addEventListener('click', function () {
      var nav = item.getAttribute('data-nav');
      
      navItems.forEach(function (n) { n.classList.remove('active'); });
      item.classList.add('active');

      if (nav === 'home') {
        hideAllScreens();
        dashScreen.removeAttribute('aria-hidden');
        void dashScreen.offsetHeight;
        dashScreen.classList.add('visible');
        dashScreen.querySelector('.doc-dash-main').scrollTo({ top: 0, behavior: 'smooth' });
        if (typeof renderQueue === 'function') renderQueue();
      } else if (nav === 'appointments') {
        hideAllScreens();
        dashScreen.removeAttribute('aria-hidden');
        void dashScreen.offsetHeight;
        dashScreen.classList.add('visible');
        if (typeof window.renderDocAppointments === 'function') window.renderDocAppointments();
        showDocScreen('doc-appointments-screen');
      } else if (nav === 'patients') {
        hideAllScreens();
        dashScreen.removeAttribute('aria-hidden');
        void dashScreen.offsetHeight;
        dashScreen.classList.add('visible');
        if (typeof window.renderDocPatients === 'function') window.renderDocPatients();
        showDocScreen('doc-patients-screen');
      } else if (nav === 'profile') {
        hideAllScreens();
        dashScreen.removeAttribute('aria-hidden');
        void dashScreen.offsetHeight;
        dashScreen.classList.add('visible');
        if (typeof window.renderDocProfile === 'function') window.renderDocProfile();
        showDocScreen('doc-profile-screen');
      } else {
        showToast('Coming next - ' + capitalize(nav));
      }
    });
  });

  var notifBtn = document.getElementById('doc-dash-notif-btn');
  if (notifBtn) {
    notifBtn.addEventListener('click', function () {
      showToast('Notifications coming soon');
    });
  }

  var profileAvatarBtn = document.getElementById('doc-dash-profile-btn');
  if (profileAvatarBtn) {
    profileAvatarBtn.addEventListener('click', function () {
      hideAllScreens();
      if (typeof window.renderDocProfile === 'function') window.renderDocProfile();
      showDocScreen('doc-profile-screen');
    });
  }

  // Back buttons on new screens
  ['doc-appointments-back', 'doc-patients-back', 'doc-profile-back'].forEach(function(id) {
    var btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', function() {
        navItems.forEach(function (n) {
           n.classList.toggle('active', n.getAttribute('data-nav') === 'home');
        });
        hideAllScreens();
        dashScreen.removeAttribute('aria-hidden');
        void dashScreen.offsetHeight;
        dashScreen.classList.add('visible');
        dashScreen.querySelector('.doc-dash-main').scrollTo({ top: 0, behavior: 'smooth' });
        if (typeof renderQueue === 'function') renderQueue();
      });
    }
  });

  // Back buttons on details screens
  ['doc-patient-details-back', 'doc-apt-details-back', 'doc-edit-profile-back'].forEach(function(id) {
    var btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', function() {
        btn.closest('.discovery-screen').classList.remove('visible');
        btn.closest('.discovery-screen').setAttribute('aria-hidden', 'true');
      });
    }
  });

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ================================================
  // Queue Controller
  // ================================================
  var docQueueEmpty = document.getElementById('doc-queue-empty');
  var docQueueActive = document.getElementById('doc-queue-active');
  var docQueueList = document.getElementById('doc-queue-list');
  var docQueueCurrent = document.getElementById('doc-queue-current');
  var docQueueNext = document.getElementById('doc-queue-next');
  var docQueueWaitingCount = document.getElementById('doc-queue-waiting-count');
  var docQueueStatusBadge = document.getElementById('doc-queue-status-badge');
  var docDelaySelect = document.getElementById('doc-delay-select');
  var callNextBtn = document.getElementById('doc-queue-call-next');
  var markCompletedBtn = document.getElementById('doc-queue-mark-completed');

  var currentQueue = [];

  function toISODate(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function getAllDoctorAppointments() {
    if (!window.DoctorLink || !window.DoctorLink.appointments) return [];
    var docId = (typeof DOCTORS !== 'undefined' && DOCTORS.length > 0) ? DOCTORS[0].id : 'doc_1';
    return window.DoctorLink.appointments.filter(function(a) {
      return a.doctorId === docId && a.status !== 'cancelled' && a.status !== 'rescheduled';
    });
  }

  function getDoctorAppointmentsForToday() {
    var today = toISODate(new Date());
    return getAllDoctorAppointments().filter(function(a) {
      var aDate = a.date;
      if (aDate && aDate.indexOf('T') !== -1) aDate = aDate.split('T')[0];
      return aDate === today;
    }).sort(function(a, b) {
      if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
      if (a.time !== b.time) return (a.time || '').localeCompare(b.time || '');
      return (a.tokenNumber || 0) - (b.tokenNumber || 0);
    });
  }

  function getDoctorActiveQueue() {
    return getDoctorAppointmentsForToday().filter(function(a) {
      var s = (a.trackingStatus || a.status || '').toLowerCase();
      return s !== 'completed' && s !== 'no_show';
    });
  }

  function renderQueue() {
    var dashScreen = document.getElementById('doc-dashboard-screen');
    if (!dashScreen) return;
    
    var docQueueList = document.getElementById('doc-queue-list');
    var docQueueEmpty = document.getElementById('doc-queue-empty');
    var docQueueActive = document.getElementById('doc-queue-active');
    
    var statToday = document.getElementById('doc-stat-today');
    var statSeen = document.getElementById('doc-stat-seen');
    var statWaiting = document.getElementById('doc-stat-waiting');
    var statCurrent = document.getElementById('doc-stat-current');

    var isClinicOpen = document.getElementById('doc-status-toggle') && document.getElementById('doc-status-toggle').checked;
    
    var currentQueue = getDoctorActiveQueue();
    var todayAllApts = getDoctorAppointmentsForToday();

    if (!isClinicOpen) {
      if (docQueueEmpty) {
        docQueueEmpty.style.display = 'flex';
        docQueueEmpty.innerHTML = '<div class="doc-queue-empty-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div><p class="doc-dash-empty-text">Clinic Closed<br><span style="font-size:0.875rem">Today\'s queue is currently inactive.</span></p>';
      }
      if (docQueueActive) docQueueActive.style.display = 'none';
      if (docQueueList) docQueueList.innerHTML = '';
      
      if (statToday) statToday.textContent = '—';
      if (statSeen) statSeen.textContent = '—';
      if (statWaiting) statWaiting.textContent = '—';
      if (statCurrent) statCurrent.textContent = '—';
    } else {
      // Determine active token (in consultation or called)
      var activeApts = currentQueue.filter(function(a) {
        return a.trackingStatus === 'in_consultation' || a.trackingStatus === 'called';
      });
      // Priority: in_consultation first, else called
      var currentApt = activeApts.find(a => a.trackingStatus === 'in_consultation') || (activeApts.length > 0 ? activeApts[0] : null);
      
      // Next in line
      var waitingAppointments = currentQueue.filter(function(a) {
        return a.trackingStatus === 'waiting' || a.trackingStatus === 'not_started' || !a.trackingStatus;
      });
      
      var nextApt = waitingAppointments.length > 0 ? waitingAppointments[0] : null;
      
      if (currentQueue.length === 0) {
        if (docQueueEmpty) {
          docQueueEmpty.style.display = 'flex';
          docQueueEmpty.innerHTML = '<div class="doc-queue-empty-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div><p class="doc-dash-empty-text">No patients in queue</p>';
        }
        if (docQueueActive) docQueueActive.style.display = 'none';
        if (docQueueList) docQueueList.innerHTML = '';
      } else {
        if (docQueueEmpty) docQueueEmpty.style.display = 'none';
        if (docQueueActive) docQueueActive.style.display = 'block';
        
        var cTokenEl = document.getElementById('doc-queue-current');
        var nTokenEl = document.getElementById('doc-queue-next');
        
        if (cTokenEl) cTokenEl.textContent = currentApt ? '#' + currentApt.tokenNumber : '-';
        if (nTokenEl) nTokenEl.textContent = nextApt ? '#' + nextApt.tokenNumber : '-';
      }

      // render list
      if (docQueueList) {
        docQueueList.innerHTML = '';
        currentQueue.forEach(function(a) {
          var statusText = 'Waiting';
          var statusColor = 'var(--color-text-muted)';
          var statusBg = '#f3f4f6';
          
          if (a.trackingStatus === 'called') {
            statusText = 'Called';
            statusColor = 'var(--color-warning-dark)';
            statusBg = 'var(--color-warning-subtle)';
          } else if (a.trackingStatus === 'in_consultation') {
            statusText = 'In Consultation';
            statusColor = 'var(--color-primary-dark)';
            statusBg = 'var(--color-primary-subtle)';
          } else if (a.trackingStatus === 'waiting' || a.trackingStatus === 'not_started' || !a.trackingStatus) {
            statusText = 'Waiting';
            statusColor = 'var(--color-accent-dark)';
            statusBg = 'var(--color-accent-subtle)';
          }

          var patName = a.patientName || 'Patient';
          if (a.patientId === 'PAT-DEMO-1' && typeof window.DoctorLink !== 'undefined' && window.DoctorLink.patientData && window.DoctorLink.patientData.name) {
             patName = window.DoctorLink.patientData.name;
          }

          var html = '<div style="display:flex; align-items:center; justify-content:space-between; padding: 8px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);">' +
            '<div style="display:flex; gap: 12px; align-items:center;">' +
              '<div style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary-subtle); color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem;">' + (a.tokenNumber || '-') + '</div>' +
              '<div>' +
                '<div style="font-weight: 500;">' + patName + '</div>' +
                '<div style="font-size: 0.75rem; color: var(--color-text-muted);">' + (a.time || '') + '</div>' +
              '</div>' +
            '</div>' +
            '<div style="padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500; background: ' + statusBg + '; color: ' + statusColor + ';">' + statusText + '</div>' +
          '</div>';
          
          docQueueList.insertAdjacentHTML('beforeend', html);
        });
      }

      // Update overview stats
      if (statToday) statToday.textContent = todayAllApts.length;
      
      if (statSeen) {
        var completedCount = todayAllApts.filter(function(a) {
          return a.trackingStatus === 'completed';
        }).length;
        statSeen.textContent = completedCount;
      }
      
      if (statWaiting) statWaiting.textContent = waitingAppointments.length;
      
      if (statCurrent) {
        if (currentApt) {
           statCurrent.textContent = '#' + currentApt.tokenNumber;
        } else {
           statCurrent.textContent = '—';
        }
      }

      // Update shared state for patients ahead calculation
      var cToken = currentApt ? currentApt.tokenNumber : (nextApt ? nextApt.tokenNumber - 1 : null);
      if (cToken === null && currentQueue.length > 0) cToken = currentQueue[0].tokenNumber - 1;
      if (cToken === null) cToken = 1;
      
      currentQueue.forEach(function(a) {
        if (a.trackingStatus === 'waiting' || a.trackingStatus === 'not_started' || !a.trackingStatus) {
          a.trackingStatus = 'waiting';
          a.currentToken = cToken;
          a.patientsAhead = Math.max(0, a.tokenNumber - cToken);
          a.estimatedWaitMinutes = a.patientsAhead * 5;
        }
      });
    }

    // Populate Detailed Today's Appointments List (Both Open and Closed states)
    var homeAptsList = document.getElementById('doc-home-appointments-list');
    var homeAptsEmpty = document.getElementById('doc-home-appointments-empty');
    if (homeAptsList) {
      if (todayAllApts.length === 0) {
        if (homeAptsEmpty) homeAptsEmpty.style.display = 'block';
        homeAptsList.innerHTML = '';
      } else {
        if (homeAptsEmpty) homeAptsEmpty.style.display = 'none';
        homeAptsList.innerHTML = '';
        todayAllApts.forEach(function(a) {
          homeAptsList.insertAdjacentHTML('beforeend', getAptHtml(a));
        });
      }
    }

    // Render Tomorrow and Upcoming Cards
    renderFutureSummaries();
  }

  function renderFutureSummaries() {
    var docId = (typeof DOCTORS !== 'undefined' && DOCTORS.length > 0) ? DOCTORS[0].id : 'doc_1';
    var todayStr = toISODate(new Date());
    
    var d = new Date();
    d.setDate(d.getDate() + 1);
    var tomorrowStr = toISODate(d);
    
    var allApts = window.DoctorLink.appointments || [];
    var tomorrowApts = [];
    var upcomingApts = [];
    
    allApts.forEach(function(a) {
      if (a.doctorId !== docId || a.status === 'cancelled' || a.status === 'rescheduled') return;
      var aDate = a.date;
      if (aDate && aDate.indexOf('T') !== -1) aDate = aDate.split('T')[0];
      
      if (aDate === tomorrowStr) {
        tomorrowApts.push(a);
      } else if (aDate > tomorrowStr) {
        upcomingApts.push(a);
      }
    });
    
    tomorrowApts.sort(function(a,b) { return (a.time || '').localeCompare(b.time || ''); });
    upcomingApts.sort(function(a,b) {
      var dComp = (a.date || '').localeCompare(b.date || '');
      return dComp !== 0 ? dComp : (a.time || '').localeCompare(b.time || '');
    });
    
    var tCountEl = document.getElementById('doc-tomorrow-count');
    var tNextEl = document.getElementById('doc-tomorrow-next');
    if (tCountEl) tCountEl.textContent = tomorrowApts.length;
    if (tNextEl) {
      if (tomorrowApts.length > 0) {
        var tokenStr = tomorrowApts[0].tokenNumber ? ' (Token #' + tomorrowApts[0].tokenNumber + ')' : '';
        tNextEl.textContent = 'Next appointment: ' + tomorrowApts[0].time + tokenStr;
      } else {
        tNextEl.textContent = 'No appointments tomorrow';
      }
    }
    
    var uCountEl = document.getElementById('doc-upcoming-count');
    var uNextEl = document.getElementById('doc-upcoming-next');
    if (uCountEl) uCountEl.textContent = upcomingApts.length;
    if (uNextEl) {
      if (upcomingApts.length > 0) {
        var fmtDate = window.DoctorLinkUtils ? window.DoctorLinkUtils.formatDateForUI(upcomingApts[0].date) : upcomingApts[0].date;
        var uTokenStr = upcomingApts[0].tokenNumber ? ' (Token #' + upcomingApts[0].tokenNumber + ')' : '';
        uNextEl.textContent = 'Next: ' + fmtDate + ', ' + upcomingApts[0].time + uTokenStr;
      } else {
        uNextEl.textContent = 'No upcoming appointments';
      }
    }
  }

  function seedDoctorDemoAppointments() {
    if (!window.DoctorLink.appointments) window.DoctorLink.appointments = [];
    
    var docId = (typeof DOCTORS !== 'undefined' && DOCTORS.length > 0) ? DOCTORS[0].id : 'doc_1';
    var facId = (typeof DOCTORS !== 'undefined' && DOCTORS.length > 0) ? DOCTORS[0].facilityId : 'fac_1';
    
    // Check if demo appointments are already seeded for this doctor today
    var todayStr = toISODate(new Date());
    var hasDemo = window.DoctorLink.appointments.some(function(a) {
      var aDate = a.date;
      if (aDate && aDate.indexOf('T') !== -1) aDate = aDate.split('T')[0];
      return a.doctorId === docId && aDate === todayStr && a.isDemo;
    });
    
    if (hasDemo) return; // already seeded
    
    var demoData = [
      { id: 'demo_apt_1', token: 12, time: '10:00 AM', status: 'no_show', pat: 'Rahul Sharma', payMethod: 'online', payStatus: 'paid' },
      { id: 'demo_apt_2', token: 13, time: '10:15 AM', status: 'completed', pat: 'Priya Patel', payMethod: 'pay_at_visit', payStatus: 'unpaid' },
      { id: 'demo_apt_3', token: 14, time: '10:30 AM', status: 'waiting', pat: 'Amit Kumar', payMethod: 'online', payStatus: 'paid' },
      { id: 'demo_apt_4', token: 15, time: '10:45 AM', status: 'waiting', pat: 'Neha Singh', payMethod: 'pay_at_visit', payStatus: 'unpaid' },
      { id: 'demo_apt_5', token: 16, time: '11:00 AM', status: 'waiting', pat: 'Vikas Gupta', payMethod: 'online', payStatus: 'paid' }
    ];
    
    demoData.forEach(function(d) {
      window.DoctorLink.appointments.push({
        appointmentId: d.id,
        patientId: 'pat_' + d.id,
        patientName: d.pat,
        doctorId: docId,
        facilityId: facId,
        date: todayStr,
        time: d.time,
        status: 'confirmed',
        trackingStatus: d.status,
        tokenNumber: d.token,
        consultationFee: 500,
        paymentMethod: d.payMethod,
        paymentStatus: d.payStatus,
        isDemo: true
      });
    });
    
    // Add one tomorrow and one upcoming for demo
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    var nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);
    
    window.DoctorLink.appointments.push({
      appointmentId: 'demo_apt_tom', patientId: 'pat_tom', patientName: 'Arjun Das',
      doctorId: docId, facilityId: facId, date: toISODate(tomorrow), time: '10:00 AM',
      status: 'confirmed', trackingStatus: 'not_started', tokenNumber: 20, isDemo: true
    });
    
    window.DoctorLink.appointments.push({
      appointmentId: 'demo_apt_upc', patientId: 'pat_upc', patientName: 'Meera Iyer',
      doctorId: docId, facilityId: facId, date: toISODate(nextWeek), time: '11:00 AM',
      status: 'confirmed', trackingStatus: 'not_started', tokenNumber: 21, isDemo: true
    });
  }

  window.resetDoctorDemoAppointments = function() {
    if (window.DoctorLink && window.DoctorLink.appointments) {
      window.DoctorLink.appointments = window.DoctorLink.appointments.filter(function(a) {
        return !a.isDemo;
      });
      console.log('Demo appointments reset.');
      renderQueue();
    }
  };

  // ... event listeners already exist above ...
  if (callNextBtn) {
    callNextBtn.addEventListener('click', function() {
      var inConsultationIndex = currentQueue.findIndex(function(a) {
        return a.trackingStatus === 'in_consultation' || a.trackingStatus === 'called';
      });
      if (inConsultationIndex !== -1) currentQueue[inConsultationIndex].trackingStatus = 'completed';
      var waitingAppointments = currentQueue.filter(function(a) {
        return a.trackingStatus === 'waiting' || a.trackingStatus === 'not_started' || !a.trackingStatus;
      });
      if (waitingAppointments.length > 0) waitingAppointments[0].trackingStatus = 'called';
      renderQueue();
    });
  }
  if (markCompletedBtn) {
    markCompletedBtn.addEventListener('click', function() {
      var inConsultationIndex = currentQueue.findIndex(function(a) {
        return a.trackingStatus === 'in_consultation' || a.trackingStatus === 'called';
      });
      if (inConsultationIndex !== -1) currentQueue[inConsultationIndex].trackingStatus = 'completed';
      renderQueue();
    });
  }
  if (docDelaySelect) {
    docDelaySelect.addEventListener('change', function() {
      var delay = parseInt(docDelaySelect.value, 10) || 0;
      var status = delay > 0 ? 'delayed' : 'on_time';
      var todayApts = getTodayAppointments();
      todayApts.forEach(function(a) {
        a.doctorQueueStatus = status;
        a.doctorDelayMinutes = delay;
      });
      renderQueue();
    });
  }

  // ================================================
  // Screens Rendering Logic
  // ================================================



  window.renderDocAppointments = function() {
    var todayApts = getDoctorAppointmentsForToday();
    var allApts = getAllDoctorAppointments();
    
    var today = toISODate(new Date());
    var upcomingApts = allApts.filter(function(a) {
      var aDate = a.date;
      if (aDate && aDate.indexOf('T') !== -1) aDate = aDate.split('T')[0];
      return aDate > today;
    }).sort(function(a, b) {
      if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
      if (a.time !== b.time) return (a.time || '').localeCompare(b.time || '');
      return (a.tokenNumber || 0) - (b.tokenNumber || 0);
    });

    var todayList = document.getElementById('doc-apts-today-list');
    var upcomingList = document.getElementById('doc-apts-upcoming-list');
    
    if (todayList) {
      todayList.innerHTML = '';
      if (todayApts.length === 0) {
        todayList.innerHTML = '<p class="doc-dash-empty-text" style="text-align:left; padding:8px 0;">No appointments today</p>';
      } else {
        todayApts.forEach(function(a) {
          todayList.insertAdjacentHTML('beforeend', getAptHtml(a));
        });
      }
    }
    if (upcomingList) {
      upcomingList.innerHTML = '';
      if (upcomingApts.length === 0) {
        upcomingList.innerHTML = '<p class="doc-dash-empty-text" style="text-align:left; padding:8px 0;">No upcoming appointments</p>';
      } else {
        upcomingApts.forEach(function(a) {
          upcomingList.insertAdjacentHTML('beforeend', getAptHtml(a));
        });
      }
    }
  };

  function getAptHtml(a) {
    var patName = a.patientName || 'Patient';
    if (a.patientId === 'PAT-DEMO-1' && typeof window.DoctorLink !== 'undefined' && window.DoctorLink.patientData && window.DoctorLink.patientData.name) {
       patName = window.DoctorLink.patientData.name;
    }
    
    var s = (a.trackingStatus || a.status || 'Scheduled').toLowerCase();
    var statusText = capitalize(s).replace('_', ' ');
    
    var statusBg = 'var(--color-accent-subtle)';
    var statusColor = 'var(--color-accent-dark)';
    
    if (s === 'called') {
      statusBg = 'var(--color-warning-subtle)';
      statusColor = 'var(--color-warning-dark)';
    } else if (s === 'in_consultation') {
      statusBg = 'var(--color-primary-subtle)';
      statusColor = 'var(--color-primary-dark)';
    } else if (s === 'completed') {
      statusBg = 'var(--color-success-subtle)';
      statusColor = 'var(--color-success-dark)';
    } else if (s === 'no_show' || s === 'cancelled') {
      statusBg = '#fee2e2';
      statusColor = '#991b1b';
    } else if (s === 'rescheduled') {
      statusBg = '#f3f4f6';
      statusColor = '#4b5563';
    }
    
    var tokenText = a.tokenNumber ? ('Token #' + a.tokenNumber) : '';
    var displayDate = window.DoctorLinkUtils ? window.DoctorLinkUtils.formatDateForUI(a.date) : a.date;
    
    var payMethod = a.paymentMethod ? capitalize(a.paymentMethod).replace('_', ' ') : 'None';
    var payStatus = a.paymentStatus ? capitalize(a.paymentStatus) : 'Pending';
    var paymentStr = payMethod + ' — ' + payStatus;
    
    var actionHtml = '';
    if (s === 'waiting' || s === 'not_started') {
      actionHtml = '<button type="button" class="btn-text" style="padding:4px 8px; font-size:0.875rem;" onclick="window.openDocAptDetails(\'' + a.appointmentId + '\')">View Patient</button>' +
                   '<button type="button" class="btn-primary" style="padding:4px 12px; font-size:0.875rem; border-radius:4px;" onclick="document.querySelector(\'[data-nav=home]\').click(); setTimeout(function(){ document.getElementById(\'doc-queue-body\').scrollIntoView({behavior:\'smooth\'})}, 100);">Queue / Manage</button>';
    } else if (s === 'called') {
      actionHtml = '<button type="button" class="btn-text" style="padding:4px 8px; font-size:0.875rem;" onclick="window.openDocAptDetails(\'' + a.appointmentId + '\')">View Patient</button>' +
                   '<button type="button" class="btn-primary" style="padding:4px 12px; font-size:0.875rem; border-radius:4px;" onclick="window.startDocAptConsultation(\'' + a.appointmentId + '\')">Start Consultation</button>';
    } else if (s === 'in_consultation') {
      actionHtml = '<button type="button" class="btn-text" style="padding:4px 8px; font-size:0.875rem;" onclick="window.openDocAptDetails(\'' + a.appointmentId + '\')">View Patient</button>' +
                   '<button type="button" class="btn-primary" style="padding:4px 12px; font-size:0.875rem; border-radius:4px;" onclick="window.markDocAptCompleted(\'' + a.appointmentId + '\')">Mark Completed</button>';
    } else {
      // Completed, no_show, cancelled, rescheduled
      actionHtml = '<button type="button" class="btn-text" style="padding:4px 8px; font-size:0.875rem;" onclick="window.openDocAptDetails(\'' + a.appointmentId + '\')">View Details</button>';
    }
    
    return '<div style="padding:16px; border:1px solid var(--color-border); border-radius:8px; background:#fff; margin-bottom:12px; display:flex; flex-direction:column; gap:12px;">' +
      '<div style="display:flex; justify-content:space-between; align-items:flex-start;">' +
        '<div>' +
          '<div style="font-weight:600; font-size:1.1rem; margin-bottom:2px; color:var(--color-primary-dark);">' + tokenText + '</div>' +
          '<div style="font-weight:600; font-size:1rem; margin-bottom:2px; color:var(--color-text);">' + patName + '</div>' +
          '<div style="font-size:0.875rem; color:var(--color-text-muted);">' + (displayDate || '') + ' at ' + (a.time || '') + '</div>' +
        '</div>' +
        '<div style="font-size:0.75rem; font-weight:500; background:' + statusBg + '; color:' + statusColor + '; padding:4px 8px; border-radius:4px;">' + statusText + '</div>' +
      '</div>' +
      '<div style="font-size:0.875rem; padding-top:8px; border-top:1px solid #eee;">' +
        '<span style="color:var(--color-text-muted);">Payment:</span> <strong>' + paymentStr + '</strong>' +
      '</div>' +
      '<div style="display:flex; justify-content:flex-end; gap:8px; margin-top:4px;">' +
        actionHtml +
      '</div>' +
    '</div>';
  }

  window.openDocAptDetails = function(aptId) {
    var apts = getAllDoctorAppointments();
    var apt = apts.find(function(a) { return a.appointmentId === aptId; });
    if (!apt) return;
    
    var patName = apt.patientName || 'Patient';
    if (apt.patientId === 'PAT-DEMO-1' && typeof window.DoctorLink !== 'undefined' && window.DoctorLink.patientData && window.DoctorLink.patientData.name) {
       patName = window.DoctorLink.patientData.name;
    }

    document.getElementById('doc-apt-det-pat-name').textContent = patName;
    document.getElementById('doc-apt-det-date').textContent = apt.date || '-';
    document.getElementById('doc-apt-det-time').textContent = apt.time || '-';
    document.getElementById('doc-apt-det-token').textContent = apt.tokenNumber ? '#' + apt.tokenNumber : '-';
    document.getElementById('doc-apt-det-status').textContent = capitalize(apt.trackingStatus || apt.status || 'Scheduled').replace('_', ' ');
    
    var payMethod = apt.paymentMethod ? capitalize(apt.paymentMethod).replace('_', ' ') : 'None';
    var payStatus = apt.paymentStatus ? capitalize(apt.paymentStatus) : 'Pending';
    
    var elPayMethod = document.getElementById('doc-apt-det-pay-method');
    var elPayStatus = document.getElementById('doc-apt-det-pay-status');
    if (elPayMethod) elPayMethod.textContent = payMethod;
    if (elPayStatus) elPayStatus.textContent = payStatus;
    
    document.getElementById('doc-apt-det-id').textContent = apt.appointmentId;
    
    var actionHtml = '';
    var s = (apt.trackingStatus || apt.status || 'Scheduled').toLowerCase();
    
    if (s === 'waiting' || s === 'not_started') {
      actionHtml = '<button type="button" class="btn-primary" style="padding:12px; font-size:1rem; border-radius:8px; width:100%;" onclick="document.querySelector(\'[data-nav=home]\').click(); setTimeout(function(){ document.getElementById(\'doc-queue-body\').scrollIntoView({behavior:\'smooth\'})}, 100);">Manage Queue</button>';
    } else if (s === 'called') {
      actionHtml = '<button type="button" class="btn-primary" style="padding:12px; font-size:1rem; border-radius:8px; width:100%;" onclick="window.startDocAptConsultation(\'' + apt.appointmentId + '\'); document.getElementById(\'doc-apt-details-back\').click();">Start Consultation</button>';
    } else if (s === 'in_consultation') {
      actionHtml = '<button type="button" class="btn-primary" style="padding:12px; font-size:1rem; border-radius:8px; width:100%;" onclick="window.markDocAptCompleted(\'' + apt.appointmentId + '\'); document.getElementById(\'doc-apt-details-back\').click();">Mark Completed</button>';
    } else {
      actionHtml = '<button type="button" class="btn-secondary" style="padding:12px; font-size:1rem; border-radius:8px; width:100%;" onclick="document.getElementById(\'doc-apt-details-back\').click();">Close</button>';
    }
    
    var actionContainer = document.getElementById('doc-apt-det-actions');
    if (actionContainer) {
      actionContainer.innerHTML = actionHtml;
    }
    
    showDocScreen('doc-appointment-details-screen');
  };

  window.startDocAptConsultation = function(aptId) {
    if (!window.DoctorLink || !window.DoctorLink.appointments) return;
    var apt = window.DoctorLink.appointments.find(function(a) { return a.appointmentId === aptId; });
    if (apt) {
      apt.trackingStatus = 'in_consultation';
      if (typeof window.renderDocAppointments === 'function') window.renderDocAppointments();
      if (typeof renderQueue === 'function') renderQueue();
    }
  };

  window.markDocAptCompleted = function(aptId) {
    if (!window.DoctorLink || !window.DoctorLink.appointments) return;
    var apt = window.DoctorLink.appointments.find(function(a) { return a.appointmentId === aptId; });
    if (apt) {
      apt.trackingStatus = 'completed';
      console.log('Appointment ' + aptId + ' marked as completed.');
      if (typeof window.renderDocAppointments === 'function') window.renderDocAppointments();
      renderQueue(); // Update dashboard overview
    }
  };

  window.renderDocPatients = function() {
    var apts = getAllDoctorAppointments().filter(function(a) { return a.status !== 'cancelled'; });
    
    // Extract unique patients
    var patientsMap = {};
    apts.forEach(function(a) {
      if (!a.patientId) return;
      if (!patientsMap[a.patientId]) {
        var patName = a.patientName || 'Patient';
        if (apt.patientId === 'PAT-DEMO-1' && typeof window.DoctorLink !== 'undefined' && window.DoctorLink.patientData && window.DoctorLink.patientData.name) {
           patName = window.DoctorLink.patientData.name;
        }
        patientsMap[a.patientId] = {
          id: a.patientId,
          name: patName,
          lastAptDate: a.date,
          history: []
        };
      }
      patientsMap[a.patientId].history.push(a);
      if (a.date > patientsMap[a.patientId].lastAptDate) {
         patientsMap[a.patientId].lastAptDate = a.date;
      }
    });

    var patientsList = document.getElementById('doc-patients-list');
    if (patientsList) {
      patientsList.innerHTML = '';
      var pKeys = Object.keys(patientsMap);
      if (pKeys.length === 0) {
        patientsList.innerHTML = '<p class="doc-dash-empty-text" style="text-align:left; padding:8px 0;">No patients found.</p>';
      } else {
        pKeys.forEach(function(pk) {
          var p = patientsMap[pk];
          var html = '<div style="padding:12px; border:1px solid var(--color-border); border-radius:8px; display:flex; align-items:center; gap:12px; cursor:pointer; background:#fff; margin-bottom:8px;" onclick="window.openDocPatientDetails(\'' + p.id + '\')">' +
            '<div style="width:40px; height:40px; border-radius:50%; background:var(--color-primary-subtle); color:var(--color-primary-dark); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.2rem;">' + p.name.charAt(0).toUpperCase() + '</div>' +
            '<div>' +
              '<div style="font-weight:600; font-size:1rem; margin-bottom:2px;">' + p.name + '</div>' +
              '<div style="font-size:0.75rem; color:var(--color-text-muted);">Last Visit: ' + (p.lastAptDate || '-') + '</div>' +
            '</div>' +
          '</div>';
          patientsList.insertAdjacentHTML('beforeend', html);
        });
      }
    }
  };

  window.openDocPatientDetails = function(patId) {
    var apts = getAllDoctorAppointments().filter(function(a) { return a.status !== 'cancelled' && a.patientId === patId; });
    if (apts.length === 0) return;
    
    var patName = apts[0].patientName || 'Patient';
    if (apt.patientId === 'PAT-DEMO-1' && typeof window.DoctorLink !== 'undefined' && window.DoctorLink.patientData && window.DoctorLink.patientData.name) {
       patName = window.DoctorLink.patientData.name;
    }
    
    document.getElementById('doc-pat-det-name').textContent = patName;
    document.getElementById('doc-pat-det-placeholder').textContent = patName.charAt(0).toUpperCase();
    document.getElementById('doc-pat-det-info').textContent = "Total Appointments: " + apts.length;
    
    var histList = document.getElementById('doc-pat-det-history');
    if (histList) {
      histList.innerHTML = '';
      // sort latest first
      apts.sort(function(a,b) { return (b.date || '').localeCompare(a.date || ''); });
      apts.forEach(function(a) {
        var statusText = capitalize(a.trackingStatus || a.status || 'Scheduled').replace('_', ' ');
        var html = '<div style="padding:12px; border:1px solid var(--color-border); border-radius:8px; display:flex; justify-content:space-between; align-items:center; background:#fff; margin-bottom:8px;" onclick="window.openDocAptDetails(\'' + a.appointmentId + '\')">' +
          '<div>' +
            '<div style="font-weight:600; font-size:0.875rem; margin-bottom:2px;">' + (a.date || '') + '</div>' +
            '<div style="font-size:0.75rem; color:var(--color-text-muted);">' + (a.time || '') + '</div>' +
          '</div>' +
          '<div style="font-size:0.75rem; font-weight:500; background:var(--color-accent-subtle); color:var(--color-accent-dark); padding:4px 8px; border-radius:4px;">' + statusText + '</div>' +
        '</div>';
        histList.insertAdjacentHTML('beforeend', html);
      });
    }
    
    showDocScreen('doc-patient-details-screen');
  };

  window.renderDocProfile = function() {
    var dData = (typeof DOCTORS !== 'undefined' && DOCTORS.length > 0) ? DOCTORS[0] : null;
    if (!dData) return;
    
    var name = dData.name || '';
    var displayName = name;
    if (name && !name.toLowerCase().startsWith('dr')) {
      displayName = 'Dr. ' + name;
    }
    
    document.getElementById('doc-prof-screen-name').textContent = displayName;
    document.getElementById('doc-prof-screen-spec').textContent = dData.specialization || '-';
    
    var imgEl = document.getElementById('doc-prof-screen-img');
    var placeEl = document.getElementById('doc-prof-screen-placeholder');
    if (dData.photoDataUrl) {
       imgEl.src = dData.photoDataUrl;
       imgEl.style.display = 'block';
       placeEl.style.display = 'none';
    } else {
       imgEl.style.display = 'none';
       placeEl.style.display = 'flex';
       placeEl.textContent = displayName.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase() || 'D';
    }
    
    document.getElementById('doc-prof-screen-reg').textContent = dData.registrationNumber || 'MED12345';
    var facName = '\u2014';
    if (dData.facilities && dData.facilities.length > 0) {
      facName = dData.facilities[0].name;
    }
    document.getElementById('doc-prof-screen-prac').textContent = facName;
  };

  // ================================================
  // Edit Profile Logic
  // ================================================
  var editProfileBtn = document.getElementById('doc-prof-edit-btn');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', function() {
      var dData = (typeof DOCTORS !== 'undefined' && DOCTORS.length > 0) ? DOCTORS[0] : null;
      if (!dData) return;
      
      document.getElementById('doc-edit-name').value = dData.name || '';
      document.getElementById('doc-edit-spec').value = dData.specialization || '';
      document.getElementById('doc-edit-reg').value = dData.registrationNumber || 'MED12345';
      document.getElementById('doc-edit-phone').value = dData.phone || '';
      
      if (dData.facilities && dData.facilities.length > 0) {
        var fac = dData.facilities[0];
        document.getElementById('doc-edit-fac').value = fac.name || '';
        document.getElementById('doc-edit-prac-type').value = fac.type || 'Clinic';
        document.getElementById('doc-edit-address').value = fac.address || '';
        document.getElementById('doc-edit-fee').value = fac.consultationFee || '';
        document.getElementById('doc-edit-hours').value = fac.workingHours || '';
      }
      
      // photo preview
      var imgEl = document.getElementById('doc-edit-photo-img');
      var placeEl = document.getElementById('doc-edit-photo-placeholder');
      if (dData.photoDataUrl) {
         imgEl.src = dData.photoDataUrl;
         imgEl.style.display = 'block';
         placeEl.style.display = 'none';
      } else {
         imgEl.style.display = 'none';
         placeEl.style.display = 'flex';
         var dispName = dData.name || 'D';
         placeEl.textContent = dispName.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase() || 'D';
      }
      
      // Store temporary photo URL if changed during edit before save
      window._tempDocPhotoDataUrl = null;
      document.getElementById('doc-edit-photo-input').value = '';
      
      showDocScreen('doc-edit-profile-screen');
    });
  }

  var editPhotoBtn = document.getElementById('doc-edit-photo-btn');
  var editPhotoInput = document.getElementById('doc-edit-photo-input');
  if (editPhotoBtn && editPhotoInput) {
    editPhotoBtn.addEventListener('click', function() {
      editPhotoInput.click();
    });
    
    editPhotoInput.addEventListener('change', function(e) {
      if (e.target.files && e.target.files[0]) {
        var reader = new FileReader();
        reader.onload = function(ev) {
          window._tempDocPhotoDataUrl = ev.target.result;
          var imgEl = document.getElementById('doc-edit-photo-img');
          var placeEl = document.getElementById('doc-edit-photo-placeholder');
          imgEl.src = ev.target.result;
          imgEl.style.display = 'block';
          placeEl.style.display = 'none';
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    });
  }

  var editProfileForm = document.getElementById('doc-edit-profile-form');
  if (editProfileForm) {
    editProfileForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      var dData = (typeof DOCTORS !== 'undefined' && DOCTORS.length > 0) ? DOCTORS[0] : null;
      if (!dData) return;
      
      dData.name = document.getElementById('doc-edit-name').value;
      dData.specialization = document.getElementById('doc-edit-spec').value;
      dData.phone = document.getElementById('doc-edit-phone').value;
      
      if (window._tempDocPhotoDataUrl) {
        dData.photoDataUrl = window._tempDocPhotoDataUrl;
      }
      
      var newFacName = document.getElementById('doc-edit-fac').value;
      var newFacType = document.getElementById('doc-edit-prac-type').value;
      var newFacAddress = document.getElementById('doc-edit-address').value;
      var newFacFee = parseInt(document.getElementById('doc-edit-fee').value, 10) || 0;
      var newFacHours = document.getElementById('doc-edit-hours').value;
      
      // Determine if practice info actually changed
      var currentFac = (dData.facilities && dData.facilities.length > 0) ? dData.facilities[0] : null;
      var practiceChanged = !currentFac || 
        currentFac.name !== newFacName || 
        currentFac.type !== newFacType || 
        currentFac.address !== newFacAddress || 
        currentFac.consultationFee !== newFacFee || 
        currentFac.workingHours !== newFacHours;
        
      if (practiceChanged) {
        // Create new facility ID to preserve historical appointments
        var newFacId = 'fac_' + new Date().getTime();
        var newFac = {
          id: newFacId,
          name: newFacName,
          type: newFacType,
          address: newFacAddress,
          consultationFee: newFacFee,
          workingHours: newFacHours
        };
        
        dData.facilityId = newFacId;
        dData.facilities = [newFac];
        
        if (typeof window.FACILITIES !== 'undefined') {
          window.FACILITIES.push(newFac);
        } else if (typeof FACILITIES !== 'undefined') {
          FACILITIES.push(newFac);
        }
      }
      
      showToast('Profile updated successfully');
      
      var editScreen = document.getElementById('doc-edit-profile-screen');
      if (editScreen) {
        editScreen.classList.remove('visible');
        editScreen.setAttribute('aria-hidden', 'true');
      }
      
      // Update UI components dynamically
      window.renderDocProfile();
      updatePracticeInfo(dData);
      
      var dName = dData.name;
      if (dName && !dName.toLowerCase().startsWith('dr')) dName = 'Dr. ' + dName;
      updateAvatar(dData.photoDataUrl, dName);
    });
  }

  // Hook into openDoctorDashboard
  var _openDoc = window.openDoctorDashboard;
  window.openDoctorDashboard = function(data) {
    if (_openDoc) _openDoc(data);
    renderQueue();
  };

})();
