const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Replace Practice Status
html = html.replace(
  '<div class=\"doc-toggle-wrap\">\n            <span class=\"doc-toggle-label\" aria-hidden=\"true\">Open</span>',
  \<div style="display:flex; align-items:center; gap: 12px;">
            <select id="doc-delay-select" class="input-field select-native" style="display:none; padding: 4px 8px; font-size: 0.75rem; height: auto;">
              <option value="0">On Time</option>
              <option value="10">Running 10m Late</option>
              <option value="15">Running 15m Late</option>
              <option value="20">Running 20m Late</option>
            </select>
            <div class="doc-toggle-wrap">
              <span class="doc-toggle-label" aria-hidden="true">Open</span>\
);
html = html.replace(
  '<input type=\"checkbox\" id=\"doc-status-toggle\" class=\"doc-toggle\" aria-label=\"Toggle clinic status\">\\n          </div>\\n        </div>',
  \<input type="checkbox" id="doc-status-toggle" class="doc-toggle" aria-label="Toggle clinic status">
            </div>
          </div>
        </div>\
);

// Replace Current Queue
const currentQueueRegex = /<!-- Current Queue -->[\\s\\S]*?<!-- Today's Appointments -->/;
const newCurrentQueue = \<!-- Current Queue -->
        <div class="doc-dash-card">
          <div class="doc-dash-card-header">
            <h3 class="doc-dash-card-title">Today's Queue</h3>
            <span id="doc-queue-status-badge" style="font-size: 0.75rem; background: var(--color-success); color: white; padding: 2px 8px; border-radius: 12px; display: none;">Active</span>
          </div>
          <div class="doc-dash-card-body" id="doc-queue-body">
            <div class="doc-dash-empty-state" id="doc-queue-empty">
              <div class="doc-dash-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <path d="M12 9v4l2 2"/>
                </svg>
              </div>
              <p class="doc-dash-empty-text">No patients in today's queue</p>
            </div>
            <div id="doc-queue-active" style="display:none;">
              <div class="doc-queue-reserve" style="margin-top: 0; padding-top: 0; border-top: none;">
                <div class="doc-queue-row">
                  <span class="doc-queue-label">Current Token</span>
                  <span class="doc-queue-value" id="doc-queue-current" style="font-size: 1.25rem; font-weight: bold; color: var(--color-text);">&mdash;</span>
                </div>
                <div class="doc-queue-row">
                  <span class="doc-queue-label">Next Patient</span>
                  <span class="doc-queue-value" id="doc-queue-next">&mdash;</span>
                </div>
                <div class="doc-queue-row">
                  <span class="doc-queue-label">Patients Waiting</span>
                  <span class="doc-queue-value" id="doc-queue-waiting-count">0</span>
                </div>
              </div>
              
              <div style="display:flex; gap: 8px; margin-top: 16px;">
                <button type="button" class="btn-primary" id="doc-queue-call-next" style="flex: 1; padding: 10px; font-size: 0.875rem;">Call Next Patient</button>
                <button type="button" class="btn-secondary" id="doc-queue-mark-completed" style="flex: 1; padding: 10px; font-size: 0.875rem;">Mark Completed</button>
              </div>

              <div style="margin-top: 24px;">
                <h4 style="font-size: 0.875rem; margin-bottom: 12px; color: var(--color-text);">Patient Queue List</h4>
                <div id="doc-queue-list" style="display:flex; flex-direction:column; gap: 8px;">
                  <!-- Queue items injected here -->
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Today's Appointments -->\;
html = html.replace(currentQueueRegex, newCurrentQueue);

fs.writeFileSync('index.html', html);
