/* ============================================
   Doctor Link — Patient Booking Logic
   ============================================ */

(function () {
  'use strict';

  // ================================================
  // State
  // ================================================
  var selectedDoc = null;
  var selectedDate = null;
  var selectedTime = null;

  // Initialize appointments array if it doesn't exist
  if (!window.DoctorLink) window.DoctorLink = {};
  if (!window.DoctorLink.appointments) window.DoctorLink.appointments = [];

  var DATES = ['Today', 'Tomorrow', 'Next available', 'Mon, Oct 12', 'Tue, Oct 13', 'Wed, Oct 14'];
  var TIMES = [
    { time: '09:00 AM', available: true },
    { time: '09:30 AM', available: false },
    { time: '10:00 AM', available: true },
    { time: '10:30 AM', available: true },
    { time: '11:00 AM', available: false },
    { time: '04:00 PM', available: true },
    { time: '04:30 PM', available: true },
    { time: '05:00 PM', available: false }
  ];

  // Helper to find facility
  function getFacility(facId) {
    // Rely on global FACILITIES from patient-discovery.js (not strictly best practice but acceptable here)
    if (typeof FACILITIES !== 'undefined') {
      return FACILITIES.find(f => f.id === facId) || { name: "Unknown Facility", type: "Unknown" };
    }
    return { name: "Unknown Facility", type: "Unknown" };
  }

  function getDoctor(docId) {
    if (typeof DOCTORS !== 'undefined') {
      return DOCTORS.find(d => d.id === docId) || { name: "Unknown Doctor", specialization: "Unknown" };
    }
    return { name: "Unknown Doctor", specialization: "Unknown" };
  }

  function getPatientName() {
    var pData = window.DoctorLink && window.DoctorLink.patientData ? window.DoctorLink.patientData : {};
    return pData.name || 'Demo Patient';
  }

  // ================================================
  // Screens & DOM
  // ================================================
  var bookScreen = document.getElementById('pat-book-appointment');
  var bookBackBtn = document.getElementById('book-back-btn');
  var bookDateList = document.getElementById('book-date-list');
  var bookTimeSection = document.getElementById('book-time-section');
  var bookTimeList = document.getElementById('book-time-list');
  var bookTimeError = document.getElementById('book-time-error');
  var bookSummarySection = document.getElementById('book-summary-section');
  var bookConfirmBtn = document.getElementById('book-confirm-btn');

  var confScreen = document.getElementById('pat-booking-confirmed');
  var confViewAptBtn = document.getElementById('conf-view-apt-btn');
  var confHomeBtn = document.getElementById('conf-home-btn');

  var detScreen = document.getElementById('pat-appointment-details');
  var detBackBtn = document.getElementById('apt-detail-back-btn');
  var detViewDocBtn = document.getElementById('det-view-doc-btn');
  var detViewFacBtn = document.getElementById('det-view-fac-btn');

  var currentViewedApt = null;

  // ================================================
  // Open Booking Flow
  // ================================================
  var selectedPaymentMethod = null;
  var bookPaymentSection = document.getElementById('book-payment-section');
  var payMethodOnline = document.getElementById('pay-method-online');
  var payMethodVisit = document.getElementById('pay-method-visit');
  var bookPaymentError = document.getElementById('book-payment-error');

  window.openBookingScreen = function (doc) {
    selectedDoc = doc;
    selectedDate = null;
    selectedTime = null;
    selectedPaymentMethod = null;

    var fac = getFacility(doc.facilityId);

    // Populate Doctor info
    document.getElementById('book-doc-name').textContent = doc.name;
    document.getElementById('book-doc-spec').textContent = doc.specialization;
    document.getElementById('book-fac-name').textContent = fac.name;

    // Reset UI
    bookTimeSection.style.display = 'none';
    if (bookPaymentSection) bookPaymentSection.style.display = 'none';
    bookSummarySection.style.display = 'none';
    bookTimeError.textContent = '';
    if (bookPaymentError) bookPaymentError.textContent = '';
    
    if (payMethodOnline) payMethodOnline.style.borderColor = 'var(--color-border)';
    if (payMethodVisit) payMethodVisit.style.borderColor = 'var(--color-border)';

    renderDates();
    showScreen(bookScreen);
  };

  if (bookBackBtn) {
    bookBackBtn.addEventListener('click', function () {
      hideScreen(bookScreen);
    });
  }

  function renderDates() {
    bookDateList.innerHTML = '';
    DATES.forEach(function (dateStr) {
      var btn = document.createElement('button');
      btn.className = 'disc-filter-btn';
      btn.textContent = dateStr;
      if (selectedDate === dateStr) {
        btn.classList.add('active');
      }
      btn.addEventListener('click', function () {
        selectedDate = dateStr;
        selectedTime = null;
        selectedPaymentMethod = null;
        bookTimeError.textContent = '';
        if (bookPaymentError) bookPaymentError.textContent = '';
        renderDates();
        renderTimes();
        if (bookPaymentSection) bookPaymentSection.style.display = 'none';
      });
      bookDateList.appendChild(btn);
    });
  }

  function renderTimes() {
    bookTimeList.innerHTML = '';
    bookTimeSection.style.display = 'block';
    bookSummarySection.style.display = 'none';

    TIMES.forEach(function (slot) {
      var btn = document.createElement('button');
      btn.className = 'disc-filter-btn';
      btn.textContent = slot.time;
      
      if (!slot.available) {
        btn.style.opacity = '0.5';
        btn.style.textDecoration = 'line-through';
        btn.style.cursor = 'not-allowed';
      } else if (selectedTime === slot.time) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', function () {
        if (!slot.available) return;
        selectedTime = slot.time;
        bookTimeError.textContent = '';
        if (bookPaymentError) bookPaymentError.textContent = '';
        renderTimes();
        if (bookPaymentSection) {
          bookPaymentSection.style.display = 'block';
          bookPaymentSection.scrollIntoView({ behavior: 'smooth' });
        }
      });

      bookTimeList.appendChild(btn);
    });
  }

  if (payMethodOnline) {
    payMethodOnline.addEventListener('click', function() {
      selectedPaymentMethod = 'online';
      payMethodOnline.style.borderColor = 'var(--color-accent)';
      payMethodVisit.style.borderColor = 'var(--color-border)';
      if (bookPaymentError) bookPaymentError.textContent = '';
      updateSummary();
    });
  }

  if (payMethodVisit) {
    payMethodVisit.addEventListener('click', function() {
      selectedPaymentMethod = 'pay_at_visit';
      payMethodVisit.style.borderColor = 'var(--color-accent)';
      payMethodOnline.style.borderColor = 'var(--color-border)';
      if (bookPaymentError) bookPaymentError.textContent = '';
      updateSummary();
    });
  }

  function updateSummary() {
    if (selectedDate && selectedTime && selectedPaymentMethod) {
      document.getElementById('summary-date').textContent = selectedDate;
      document.getElementById('summary-time').textContent = selectedTime;
      document.getElementById('summary-patient').textContent = getPatientName();
      bookSummarySection.style.display = 'block';
      // scroll to bottom
      bookSummarySection.scrollIntoView({ behavior: 'smooth' });
    } else {
      bookSummarySection.style.display = 'none';
    }
  }

  // ================================================
  // Confirm Appointment
  // ================================================
  if (bookConfirmBtn) {
    bookConfirmBtn.addEventListener('click', function () {
      if (!selectedDoc || !selectedDate || !selectedTime || !selectedPaymentMethod) {
        if (bookPaymentError) bookPaymentError.textContent = 'Please select a valid date, time, and payment method.';
        return;
      }

      var pData = window.DoctorLink && window.DoctorLink.patientData ? window.DoctorLink.patientData : {};
      var patientId = pData.id || 'PAT-DEMO-1';

      var normCheckDate = window.DoctorLinkUtils ? window.DoctorLinkUtils.normalizeDateString(selectedDate) : selectedDate;
      var isDoubleBooked = window.DoctorLink.appointments.some(function (apt) {
        return apt.patientId === patientId && 
               apt.doctorId === selectedDoc.id &&
               (apt.date === normCheckDate || apt.date === selectedDate) &&
               apt.time === selectedTime &&
               apt.status !== 'cancelled';
      });

      if (isDoubleBooked) {
        if (bookPaymentError) bookPaymentError.textContent = 'You already have an appointment for this time.';
        return;
      }

      if (selectedPaymentMethod === 'online') {
        openOnlinePaymentScreen();
      } else {
        processBooking('pay_at_visit', 'unpaid', null);
      }
    });
  }

  var onlinePayScreen = document.getElementById('pat-online-payment');
  var onlinePayBackBtn = document.getElementById('payment-back-btn');
  var onlinePayBtn = document.getElementById('payment-pay-btn');

  function openOnlinePaymentScreen() {
    showScreen(onlinePayScreen);
  }

  if (onlinePayBackBtn) {
    onlinePayBackBtn.addEventListener('click', function() {
      hideScreen(onlinePayScreen);
    });
  }

  if (onlinePayBtn) {
    onlinePayBtn.addEventListener('click', function() {
      var txnId = 'TXN-DEMO-' + Math.floor(1000 + Math.random() * 9000);
      hideScreen(onlinePayScreen);
      if (typeof showToast === 'function') showToast('Payment Successful');
      processBooking('online', 'paid', txnId);
    });
  }

  function processBooking(paymentMethod, paymentStatus, txnId) {
    var pData = window.DoctorLink && window.DoctorLink.patientData ? window.DoctorLink.patientData : {};
    var patientId = pData.id || 'PAT-DEMO-1';

    var aptId = 'APT-DEMO-' + (1000 + window.DoctorLink.appointments.length + 1);

    var normDate = window.DoctorLinkUtils ? window.DoctorLinkUtils.normalizeDateString(selectedDate) : selectedDate;
    var uiDate = window.DoctorLinkUtils ? window.DoctorLinkUtils.formatDateForUI(normDate) : selectedDate;

    var newApt = {
      appointmentId: aptId,
      patientId: patientId,
      doctorId: selectedDoc.id,
      facilityId: selectedDoc.facilityId,
      date: normDate,
      time: selectedTime,
      status: 'confirmed',
      consultationFee: 500,
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      transactionId: txnId,
      createdAt: new Date().toISOString()
    };

    if (window.DoctorLinkUtils && window.DoctorLinkUtils.initQueueData) {
      window.DoctorLinkUtils.initQueueData(newApt);
    }
    window.DoctorLink.appointments.push(newApt);
    
    // Add Recent Activity
    if (!window.DoctorLink.recentActivity) window.DoctorLink.recentActivity = [];
    window.DoctorLink.recentActivity.push({
      type: 'booked',
      message: 'Appointment booked with ' + selectedDoc.name,
      subtext: uiDate + ' at ' + selectedTime,
      date: new Date().toISOString()
    });

    if (paymentMethod === 'online') {
      window.DoctorLink.recentActivity.push({
        type: 'payment',
        message: 'Payment of ₹500 completed',
        subtext: 'TXN ID: ' + txnId,
        date: new Date().toISOString()
      });
    }

    showConfirmationScreen(newApt);
  }

  function showConfirmationScreen(apt) {
    var doc = getDoctor(apt.doctorId);
    var fac = getFacility(apt.facilityId);
    
    var displayDate = window.DoctorLinkUtils ? window.DoctorLinkUtils.formatDateForUI(apt.date) : apt.date;

    document.getElementById('conf-apt-id').textContent = apt.appointmentId;
    document.getElementById('conf-doc-name').textContent = doc.name;
    document.getElementById('conf-doc-spec').textContent = doc.specialization;
    document.getElementById('conf-date').textContent = displayDate;
    document.getElementById('conf-time').textContent = apt.time;
    document.getElementById('conf-fac-name').textContent = fac.name;
    document.getElementById('conf-patient').textContent = getPatientName();

    hideScreen(bookScreen);
    showScreen(confScreen);

    // Also refresh the My Appointments list
    if (typeof renderMyAppointments === 'function') {
      renderMyAppointments();
    }
  }

  if (confViewAptBtn) {
    confViewAptBtn.addEventListener('click', function () {
      hideScreen(confScreen);
      if (typeof openMyAppointments === 'function') {
        openMyAppointments();
      }
    });
  }

  if (confHomeBtn) {
    confHomeBtn.addEventListener('click', function () {
      hideScreen(confScreen);
      var dashScreens = document.querySelectorAll('.discovery-screen');
      dashScreens.forEach(function(s) { s.classList.remove('visible'); s.setAttribute('aria-hidden', 'true'); });
      if (typeof window.renderDashboardHome === 'function') window.renderDashboardHome();
      var dashMain = document.querySelector('.dash-main');
      if (dashMain) dashMain.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ================================================
  // My Appointments List & Details
  // ================================================

  // Hook into patient-dashboard.js's openMyAppointments globally if possible
  // To avoid duplicate code, we will override or attach to it.
  
  window.renderMyAppointments = function () {
    var listEl = document.getElementById('appointments-list');
    var emptyEl = document.getElementById('appointments-empty');
    if (!listEl || !emptyEl) return;

    var apts = window.DoctorLink.appointments || [];

    listEl.innerHTML = '';

    if (apts.length === 0) {
      listEl.style.display = 'none';
      emptyEl.style.display = 'block';
    } else {
      emptyEl.style.display = 'none';
      listEl.style.display = 'flex';
      
      // Reverse to show newest first
      var sortedApts = apts.slice().reverse();

      sortedApts.forEach(function (apt) {
        var doc = getDoctor(apt.doctorId);
        var fac = getFacility(apt.facilityId);
        
        if (window.DoctorLinkUtils && window.DoctorLinkUtils.initQueueData && apt.status !== 'cancelled') {
           window.DoctorLinkUtils.initQueueData(apt);
        }

        var statusColor = apt.status === 'cancelled' ? '#d32f2f' : '#2e7d32';
        var tokenHtml = '';
        if (typeof apt.tokenNumber !== 'undefined' && apt.status !== 'cancelled') {
           tokenHtml = '<div style="margin-top: 8px; font-size: 0.75rem; font-weight: 700; color: var(--color-accent-dark); background: var(--color-surface); padding: 4px 8px; border-radius: 4px; display: inline-block; border: 1px solid var(--color-accent-dark);">Token #' + apt.tokenNumber + '</div>';
        }

        var card = document.createElement('button');
        card.className = 'disc-card';
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
            <div class="disc-card-subtitle" style="color:var(--color-accent-dark);">${doc.specialization}</div>
            <div style="font-size:0.75rem; font-weight:600; padding:2px 6px; border-radius:4px; background:${statusColor}; color:#fff;">${apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}</div>
          </div>
          <div class="disc-card-title">${doc.name}</div>
          <div class="disc-card-loc" style="margin-top:4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 21v-4h6v4"/><path d="M12 7v4m-2-2h4"/></svg>
            ${fac.name}
          </div>
          <div class="disc-card-loc">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${window.DoctorLinkUtils ? window.DoctorLinkUtils.formatDateForUI(apt.date) : apt.date} at ${apt.time}
          </div>
          ${tokenHtml}
        `;
        card.addEventListener('click', function () {
          openAppointmentDetails(apt);
        });
        listEl.appendChild(card);
      });
    }
  };

  var detRescheduleBtn = document.getElementById('det-reschedule-btn');
  var detCancelBtn = document.getElementById('det-cancel-btn');
  var cancelModal = document.getElementById('cancel-modal');
  var cancelKeepBtn = document.getElementById('cancel-keep-btn');
  var cancelConfirmBtn = document.getElementById('cancel-confirm-btn');

  window.triggerAptDetails = openAppointmentDetails;
  function openAppointmentDetails(apt) {
    currentViewedApt = apt;
    var doc = getDoctor(apt.doctorId);
    var fac = getFacility(apt.facilityId);

    document.getElementById('det-apt-id').textContent = apt.appointmentId;
    
    var statusEl = document.getElementById('det-status');
    statusEl.textContent = apt.status.charAt(0).toUpperCase() + apt.status.slice(1);
    if (apt.status === 'cancelled') {
      statusEl.style.background = '#d32f2f';
    } else {
      statusEl.style.background = '#2e7d32';
    }

    var displayDate = window.DoctorLinkUtils ? window.DoctorLinkUtils.formatDateForUI(apt.date) : apt.date;
    document.getElementById('det-datetime').textContent = displayDate + ' at ' + apt.time;
    document.getElementById('det-patient').textContent = getPatientName();
    
    document.getElementById('det-doc-name').textContent = doc.name;
    document.getElementById('det-doc-spec').textContent = doc.specialization;
    document.getElementById('det-fac-name').textContent = fac.name;

    // Payment Info
    document.getElementById('det-fee').textContent = '₹' + apt.consultationFee;
    var payMethodStr = apt.paymentMethod === 'online' ? 'Online' : 'Pay at Visit';
    document.getElementById('det-pay-method').textContent = payMethodStr;

    var payStatusStr = 'Not Paid';
    if (apt.paymentStatus === 'paid') payStatusStr = 'Paid';
    else if (apt.paymentStatus === 'refund_initiated') payStatusStr = 'Refund Initiated';
    else if (apt.paymentStatus === 'refunded') payStatusStr = 'Refunded';
    document.getElementById('det-pay-status').textContent = payStatusStr;

    var refundMsgEl = document.getElementById('det-refund-msg');
    if (apt.status === 'cancelled' && apt.paymentMethod === 'online') {
      refundMsgEl.style.display = 'block';
      refundMsgEl.innerHTML = `<strong>Appointment Cancelled.</strong><br/>Your refund of ₹${apt.refundAmount || apt.consultationFee} has been initiated (ID: ${apt.refundId || 'N/A'}).<br/>Expected within 5-7 business days.`;
    } else if (apt.status === 'cancelled' && apt.paymentMethod === 'pay_at_visit') {
      refundMsgEl.style.display = 'block';
      refundMsgEl.innerHTML = `<strong>Appointment Cancelled.</strong><br/>No payment was collected for this appointment.`;
    } else {
      refundMsgEl.style.display = 'none';
    }

    // Action Buttons
    if (apt.status === 'cancelled') {
      if (detRescheduleBtn) detRescheduleBtn.style.display = 'none';
      if (detCancelBtn) detCancelBtn.style.display = 'none';
    } else {
      if (detRescheduleBtn) detRescheduleBtn.style.display = 'block';
      if (detCancelBtn) detCancelBtn.style.display = 'block';
    }

    // Live Queue / Token Initialization
    var queueSection = document.getElementById('det-queue-section');
    if (apt.status === 'cancelled') {
      if (queueSection) queueSection.style.display = 'none';
    } else {
      if (window.DoctorLinkUtils && window.DoctorLinkUtils.initQueueData) {
        window.DoctorLinkUtils.initQueueData(apt);
      }
      if (queueSection && typeof apt.tokenNumber !== 'undefined') {
        queueSection.style.display = 'block';
        document.getElementById('det-queue-token').textContent = '#' + apt.tokenNumber;
        
        var qCurrentBox = document.getElementById('det-queue-now-serving-box');
        var qAheadBox = document.getElementById('det-queue-ahead-box');
        var qDocStat = document.getElementById('det-queue-doc-status');
        var qNotStarted = document.getElementById('det-queue-not-started');
        var qTrackBtn = document.getElementById('det-track-queue-btn');

        if (apt.trackingStatus === 'not_started') {
           qCurrentBox.style.display = 'none';
           qAheadBox.style.display = 'none';
           qDocStat.style.display = 'none';
           qTrackBtn.style.display = 'none';
           qNotStarted.style.display = 'block';
        } else {
           qCurrentBox.style.display = 'block';
           qAheadBox.style.display = 'flex';
           qDocStat.style.display = 'block';
           qTrackBtn.style.display = 'block';
           qNotStarted.style.display = 'none';
           
           document.getElementById('det-queue-current').textContent = '#' + apt.currentToken;
           document.getElementById('det-queue-ahead').textContent = apt.patientsAhead;
           document.getElementById('det-queue-wait').textContent = '~' + apt.estimatedWaitMinutes + ' min';
           
           if (apt.doctorQueueStatus === 'delayed') {
              qDocStat.textContent = 'Doctor is running ' + (apt.doctorDelayMinutes || 15) + ' min late';
              qDocStat.style.color = '#d32f2f';
           } else {
              qDocStat.textContent = 'Doctor is on time';
              qDocStat.style.color = '#2e7d32';
           }
        }
      } else if (queueSection) {
        queueSection.style.display = 'none';
      }
    }

    showScreen(detScreen);
  }

  if (detBackBtn) {
    detBackBtn.addEventListener('click', function () {
      hideScreen(detScreen);
    });
  }

  var trackScreen = document.getElementById('pat-token-tracking');
  var trackBackBtn = document.getElementById('track-back-btn');
  var trackBtn = document.getElementById('det-track-queue-btn');

  if (trackBackBtn) {
    trackBackBtn.addEventListener('click', function() {
      hideScreen(trackScreen);
    });
  }

  if (trackBtn) {
    trackBtn.addEventListener('click', function() {
      if (!currentViewedApt) return;
      window.openTokenTracking(currentViewedApt);
    });
  }

  window.openTokenTracking = function(apt) {
    var doc = getDoctor(apt.doctorId);
    var fac = getFacility(apt.facilityId);
    
    var displayDate = window.DoctorLinkUtils ? window.DoctorLinkUtils.formatDateForUI(apt.date) : apt.date;
    
    document.getElementById('track-doc-name').textContent = 'Dr. ' + doc.name;
    document.getElementById('track-fac-name').textContent = fac.name;
    document.getElementById('track-datetime').textContent = displayDate + ' at ' + apt.time;

    document.getElementById('track-your-token').textContent = '#' + apt.tokenNumber;
    document.getElementById('track-now-serving').textContent = '#' + apt.currentToken;
    document.getElementById('track-patients-ahead').textContent = apt.patientsAhead;
    document.getElementById('track-est-wait').textContent = '~' + apt.estimatedWaitMinutes + ' min';

    var docStat = document.getElementById('track-doc-status');
    if (apt.doctorQueueStatus === 'delayed') {
      docStat.textContent = 'Doctor is running ' + (apt.doctorDelayMinutes || 15) + ' min late';
      docStat.style.color = '#d32f2f';
    } else {
      docStat.textContent = 'Doctor is on time';
      docStat.style.color = 'var(--color-text-muted)';
    }

    var statusMsg = document.getElementById('track-status-msg');
    if (apt.trackingStatus === 'called') statusMsg.textContent = 'Please proceed to the doctor';
    else if (apt.trackingStatus === 'in_consultation') statusMsg.textContent = 'You are currently with the doctor';
    else if (apt.trackingStatus === 'completed') statusMsg.textContent = 'Appointment completed';
    else if (apt.trackingStatus === 'cancelled') statusMsg.textContent = 'Appointment cancelled';
    else statusMsg.textContent = 'Waiting for your turn';

    // Queue Progress Visualizer
    var pBar = document.getElementById('track-progress-bar');
    pBar.innerHTML = '';
    var startT = Math.max(1, apt.currentToken - 2);
    var endT = Math.max(apt.tokenNumber + 1, apt.currentToken + 3);
    for (var i = startT; i <= endT; i++) {
      var box = document.createElement('div');
      box.style.padding = '8px 12px';
      box.style.borderRadius = '4px';
      box.style.fontWeight = '600';
      box.style.minWidth = '40px';
      box.style.textAlign = 'center';
      
      if (i === apt.tokenNumber) {
        box.style.background = 'var(--color-accent-dark)';
        box.style.color = '#fff';
        box.textContent = '#' + i;
      } else if (i < apt.currentToken) {
        box.style.background = 'var(--color-surface)';
        box.style.color = 'var(--color-text-muted)';
        box.textContent = i;
      } else if (i === apt.currentToken) {
        box.style.background = '#e3f2fd'; // highlighted current
        box.style.color = 'var(--color-accent-dark)';
        box.style.border = '1px solid var(--color-accent-dark)';
        box.textContent = i;
      } else {
        box.style.background = 'var(--color-surface)';
        box.style.color = 'var(--color-text)';
        box.textContent = i;
      }
      pBar.appendChild(box);
      
      if (i < endT) {
        var arrow = document.createElement('div');
        arrow.textContent = '→';
        arrow.style.color = 'var(--color-text-muted)';
        pBar.appendChild(arrow);
      }
    }

    showScreen(trackScreen);
  }

  if (detViewDocBtn) {
    detViewDocBtn.addEventListener('click', function () {
      if (currentViewedApt && typeof openDoctorProfile === 'function') {
        var doc = getDoctor(currentViewedApt.doctorId);
        openDoctorProfile(doc);
      }
    });
  }

  if (detViewFacBtn) {
    detViewFacBtn.addEventListener('click', function () {
      if (currentViewedApt && typeof openFacilityDetails === 'function') {
        var fac = getFacility(currentViewedApt.facilityId);
        openFacilityDetails(fac);
      }
    });
  }

  // --- Cancel Flow ---
  if (detCancelBtn) {
    detCancelBtn.addEventListener('click', function() {
      if (cancelModal) cancelModal.style.display = 'flex';
    });
  }
  if (cancelKeepBtn) {
    cancelKeepBtn.addEventListener('click', function() {
      if (cancelModal) cancelModal.style.display = 'none';
    });
  }
  if (cancelConfirmBtn) {
    cancelConfirmBtn.addEventListener('click', function() {
      if (cancelModal) cancelModal.style.display = 'none';
      cancelAppointment(currentViewedApt);
    });
  }

  function cancelAppointment(apt) {
    apt.status = 'cancelled';
    if (!window.DoctorLink.recentActivity) window.DoctorLink.recentActivity = [];

    if (apt.paymentMethod === 'online') {
      apt.paymentStatus = 'refund_initiated';
      apt.refundId = 'RFND-DEMO-' + Math.floor(1000 + Math.random() * 9000);
      apt.refundAmount = apt.consultationFee;
      
      window.DoctorLink.recentActivity.push({
        type: 'cancelled',
        message: 'Appointment cancelled',
        subtext: 'Refund initiated for ₹' + apt.refundAmount,
        date: new Date().toISOString()
      });
    } else {
      window.DoctorLink.recentActivity.push({
        type: 'cancelled',
        message: 'Appointment cancelled',
        subtext: 'No payment was collected',
        date: new Date().toISOString()
      });
    }

    if (typeof renderMyAppointments === 'function') renderMyAppointments();
    if (typeof window.renderDashboardHome === 'function') window.renderDashboardHome();
    
    // Refresh details screen
    openAppointmentDetails(apt);
    if (typeof showToast === 'function') showToast('Appointment Cancelled');
  }

  // --- Reschedule Flow ---
  var reschedScreen = document.getElementById('pat-reschedule-appointment');
  var reschedBackBtn = document.getElementById('resched-back-btn');
  var reschedDateList = document.getElementById('resched-date-list');
  var reschedTimeSection = document.getElementById('resched-time-section');
  var reschedTimeList = document.getElementById('resched-time-list');
  var reschedError = document.getElementById('resched-error');
  var reschedSummarySection = document.getElementById('resched-summary-section');
  var reschedConfirmBtn = document.getElementById('resched-confirm-btn');
  
  var rDate = null;
  var rTime = null;

  if (detRescheduleBtn) {
    detRescheduleBtn.addEventListener('click', function() {
      rDate = null;
      rTime = null;
      reschedTimeSection.style.display = 'none';
      reschedSummarySection.style.display = 'none';
      if (reschedError) reschedError.textContent = '';
      
      renderReschedDates();
      showScreen(reschedScreen);
    });
  }

  if (reschedBackBtn) {
    reschedBackBtn.addEventListener('click', function() {
      hideScreen(reschedScreen);
    });
  }

  function renderReschedDates() {
    reschedDateList.innerHTML = '';
    DATES.forEach(function(dateStr) {
      var btn = document.createElement('button');
      btn.className = 'disc-filter-btn';
      btn.textContent = dateStr;
      if (rDate === dateStr) btn.classList.add('active');
      btn.addEventListener('click', function() {
        rDate = dateStr;
        rTime = null;
        if (reschedError) reschedError.textContent = '';
        renderReschedDates();
        renderReschedTimes();
      });
      reschedDateList.appendChild(btn);
    });
  }

  function renderReschedTimes() {
    reschedTimeList.innerHTML = '';
    reschedTimeSection.style.display = 'block';
    reschedSummarySection.style.display = 'none';

    TIMES.forEach(function(slot) {
      var btn = document.createElement('button');
      btn.className = 'disc-filter-btn';
      btn.textContent = slot.time;
      if (!slot.available) {
        btn.style.opacity = '0.5';
        btn.style.textDecoration = 'line-through';
        btn.style.cursor = 'not-allowed';
      } else if (rTime === slot.time) {
        btn.classList.add('active');
      }
      btn.addEventListener('click', function() {
        if (!slot.available) return;
        rTime = slot.time;
        if (reschedError) reschedError.textContent = '';
        renderReschedTimes();
        updateReschedSummary();
      });
      reschedTimeList.appendChild(btn);
    });
  }

  function updateReschedSummary() {
    if (rDate && rTime) {
      var doc = getDoctor(currentViewedApt.doctorId);
      var fac = getFacility(currentViewedApt.facilityId);
      
      var oldDisplayDate = window.DoctorLinkUtils ? window.DoctorLinkUtils.formatDateForUI(currentViewedApt.date) : currentViewedApt.date;
      document.getElementById('resched-old-datetime').textContent = oldDisplayDate + ' at ' + currentViewedApt.time;
      document.getElementById('resched-new-datetime').textContent = rDate + ' at ' + rTime;
      document.getElementById('resched-doc-name').textContent = doc.name;
      document.getElementById('resched-fac-name').textContent = fac.name;
      
      reschedSummarySection.style.display = 'block';
      reschedSummarySection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  if (reschedConfirmBtn) {
    reschedConfirmBtn.addEventListener('click', function() {
      if (!rDate || !rTime) {
        if (reschedError) reschedError.textContent = 'Please select a new date and time.';
        return;
      }

      var normReschedDate = window.DoctorLinkUtils ? window.DoctorLinkUtils.normalizeDateString(rDate) : rDate;
      var uiReschedDate = window.DoctorLinkUtils ? window.DoctorLinkUtils.formatDateForUI(normReschedDate) : rDate;

      currentViewedApt.date = normReschedDate;
      currentViewedApt.time = rTime;
      currentViewedApt.status = 'rescheduled'; // optional, or keep 'confirmed'

      if (!window.DoctorLink.recentActivity) window.DoctorLink.recentActivity = [];
      window.DoctorLink.recentActivity.push({
        type: 'rescheduled',
        message: 'Appointment rescheduled',
        subtext: uiReschedDate + ' at ' + rTime,
        date: new Date().toISOString()
      });

      hideScreen(reschedScreen);
      if (typeof showToast === 'function') showToast('Appointment Rescheduled');
      
      if (typeof renderMyAppointments === 'function') renderMyAppointments();
      if (typeof window.renderDashboardHome === 'function') window.renderDashboardHome();
      
      openAppointmentDetails(currentViewedApt);
    });
  }

  // --- Payments History ---
  var paymentsScreen = document.getElementById('pat-my-payments');
  var paymentsBackBtn = document.getElementById('payments-back-btn');
  var paymentsList = document.getElementById('payments-list');
  var paymentsEmpty = document.getElementById('payments-empty');

  window.openMyPayments = function() {
    renderMyPayments();
    showScreen(paymentsScreen);
  };

  if (paymentsBackBtn) {
    paymentsBackBtn.addEventListener('click', function() {
      hideScreen(paymentsScreen);
    });
  }

  function renderMyPayments() {
    if (!paymentsList || !paymentsEmpty) return;

    var apts = window.DoctorLink.appointments || [];
    
    paymentsList.innerHTML = '';
    
    if (apts.length === 0) {
      paymentsList.style.display = 'none';
      paymentsEmpty.style.display = 'block';
    } else {
      paymentsEmpty.style.display = 'none';
      paymentsList.style.display = 'flex';
      
      var sortedApts = apts.slice().reverse();
      
      sortedApts.forEach(function(apt) {
        var doc = getDoctor(apt.doctorId);
        
        var card = document.createElement('div');
        card.className = 'disc-card';
        card.style.cursor = 'default';

        var titleStr = 'Dr. ' + doc.name;
        var methodStr = apt.paymentMethod === 'online' ? 'Online' : 'Pay at Visit';
        var statusStr = 'Not Paid';
        var statusColor = 'var(--color-text-secondary)';

        if (apt.paymentMethod === 'online') {
          if (apt.paymentStatus === 'paid') {
            statusStr = 'Paid';
            statusColor = '#2e7d32';
          } else if (apt.paymentStatus === 'refund_initiated') {
            statusStr = 'Refund Initiated';
            statusColor = 'var(--color-accent-dark)';
          } else if (apt.paymentStatus === 'refunded') {
            statusStr = 'Refunded';
            statusColor = '#2e7d32';
          }
        }

        var html = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
            <div class="disc-card-title">${doc.name}</div>
            <div style="font-size:0.75rem; font-weight:600; padding:2px 6px; border-radius:4px; background:${statusColor}; color:#fff;">${statusStr}</div>
          </div>
          <div class="disc-card-loc">Appointment: ${apt.appointmentId}</div>
          <div class="disc-card-loc">Date: ${window.DoctorLinkUtils ? window.DoctorLinkUtils.formatDateForUI(apt.date) : apt.date}</div>
          <div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--color-border); padding-top:8px;">
            <div>
              <div style="font-size:1.125rem; font-weight:700; color:var(--color-text);">₹${apt.consultationFee}</div>
              <div style="font-size:0.75rem; color:var(--color-text-muted);">${methodStr}</div>
            </div>
          </div>
        `;

        if (apt.paymentMethod === 'online') {
          var txnStr = `
            <div style="font-size:0.75rem; color:var(--color-text-secondary); margin-top:4px;">TXN ID: ${apt.transactionId || 'N/A'}</div>
          `;
          html = html.replace('</div>\n          </div>\n        `', '</div>\n            <div style="text-align:right;">' + txnStr + '</div>\n          </div>\n        `'); // this is a hack to inject, let's just do it properly
        }
        
        var bottomHtml = `
          <div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--color-border); padding-top:8px;">
            <div>
              <div style="font-size:1.125rem; font-weight:700; color:var(--color-text);">₹${apt.consultationFee}</div>
              <div style="font-size:0.75rem; color:var(--color-text-muted);">${methodStr}</div>
            </div>
            ${apt.paymentMethod === 'online' ? `<div style="text-align:right;"><div style="font-size:0.75rem; color:var(--color-text-secondary);">TXN: ${apt.transactionId || 'N/A'}</div></div>` : ''}
          </div>
        `;

        if (apt.paymentStatus === 'refund_initiated' || apt.paymentStatus === 'refunded') {
          bottomHtml += `
            <div style="margin-top:8px; padding:8px; background:var(--color-surface); border-radius:4px; font-size:0.75rem;">
              <strong style="color:var(--color-text);">Refund: ₹${apt.refundAmount || apt.consultationFee}</strong><br/>
              <span style="color:var(--color-text-secondary);">Refund ID: ${apt.refundId || 'N/A'}</span><br/>
              <span style="color:var(--color-text-muted); display:block; margin-top:4px;">Refund initiated for cancelled appointment. Expected within 5-7 business days.</span>
            </div>
          `;
        }

        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
            <div class="disc-card-title">${doc.name}</div>
            <div style="font-size:0.75rem; font-weight:600; padding:2px 6px; border-radius:4px; background:${statusColor}; color:#fff;">${statusStr}</div>
          </div>
          <div class="disc-card-loc">Appointment: ${apt.appointmentId}</div>
          <div class="disc-card-loc">Date: ${window.DoctorLinkUtils ? window.DoctorLinkUtils.formatDateForUI(apt.date) : apt.date}</div>
          ${bottomHtml}
        `;

        paymentsList.appendChild(card);
      });
    }
  }

  // ================================================
  // Global Helpers
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

})();
