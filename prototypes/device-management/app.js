// Device Management Platform - Application Logic

(function() {
  'use strict';

  // State
  let selectedRoomId = null;
  let selectedDevices = new Set();
  let currentFilter = 'all';
  let searchQuery = '';
  let locationSearchQuery = '';
  let sortColumn = null;
  let sortDirection = 'asc';
  let allExpanded = false;

  // DOM Elements
  const locationTree = document.getElementById('locationTree');
  const locationSearch = document.getElementById('locationSearch');
  const statusFilter = document.getElementById('statusFilter');
  const expandToggle = document.getElementById('expandToggle');
  const emptyState = document.getElementById('emptyState');
  const roomView = document.getElementById('roomView');
  const breadcrumb = document.getElementById('breadcrumb');
  const deviceCounts = document.getElementById('deviceCounts');
  const inlineBulkActions = document.getElementById('inlineBulkActions');
  const inlineBulkBtn = document.getElementById('inlineBulkBtn');
  const inlineBulkMenu = document.getElementById('inlineBulkMenu');
  const inlineSelectedCount = document.getElementById('inlineSelectedCount');
  const deviceSearch = document.getElementById('deviceSearch');
  const deviceTableBody = document.getElementById('deviceTableBody');
  const selectAllCheckbox = document.getElementById('selectAll');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  // Control Panel elements
  const controlPanelPopout = document.getElementById('controlPanelPopout');
  const panelCloseBtn = document.getElementById('panelCloseBtn');
  const panelDeviceIcon = document.getElementById('panelDeviceIcon');
  const panelDeviceName = document.getElementById('panelDeviceName');
  const panelDeviceType = document.getElementById('panelDeviceType');
  const controllerPanelContent = document.getElementById('controllerPanelContent');
  const vtlpPanelContent = document.getElementById('vtlpPanelContent');
  const tablePanelWrapper = document.querySelector('.table-panel-wrapper');

  // Panel state
  let activePanelDeviceId = null;

  // View state
  let currentView = 'helpdesk'; // 'helpdesk' or 'dashboard'

  // Dashboard elements
  const dashboardView = document.getElementById('dashboardView');
  const helpDeskView = document.getElementById('helpDeskView');
  const menuItems = document.querySelectorAll('.menu-item');

  // Icons
  const icons = {
    school: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>`,
    campus: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="3"></circle><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"></path></svg>`,
    building: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="6" x2="9" y2="6.01"></line><line x1="15" y1="6" x2="15" y2="6.01"></line><line x1="9" y1="10" x2="9" y2="10.01"></line><line x1="15" y1="10" x2="15" y2="10.01"></line><line x1="9" y1="14" x2="9" y2="14.01"></line><line x1="15" y1="14" x2="15" y2="14.01"></line><line x1="9" y1="18" x2="15" y2="18"></line></svg>`,
    room: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
    chevron: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`
  };

  // Device icons for the info column
  const deviceIcons = {
    controller: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
    tlp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12" y2="18.01"></line></svg>`,
    projector: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="10" rx="2" ry="2"></rect><circle cx="8" cy="12" r="2"></circle><line x1="14" y1="10" x2="18" y2="10"></line><line x1="14" y1="14" x2="18" y2="14"></line><line x1="6" y1="17" x2="6" y2="20"></line><line x1="18" y1="17" x2="18" y2="20"></line></svg>`,
    microphone: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`,
    onboarded: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    discovered: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
  };

  // Fuzzy match function - returns match info with indices for highlighting
  function fuzzyMatch(text, query) {
    if (!query) return { matches: true, indices: [] };

    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    // Try exact substring match first
    const exactIndex = textLower.indexOf(queryLower);
    if (exactIndex !== -1) {
      const indices = [];
      for (let i = 0; i < query.length; i++) {
        indices.push(exactIndex + i);
      }
      return { matches: true, indices };
    }

    // Fuzzy match - characters must appear in order
    const indices = [];
    let queryIdx = 0;

    for (let i = 0; i < text.length && queryIdx < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIdx]) {
        indices.push(i);
        queryIdx++;
      }
    }

    if (queryIdx === queryLower.length) {
      return { matches: true, indices };
    }

    return { matches: false, indices: [] };
  }

  // Highlight matched characters in text
  function highlightMatch(text, indices) {
    if (!indices || indices.length === 0) return text;

    let result = '';
    let lastIndex = 0;

    // Group consecutive indices for cleaner highlighting
    const groups = [];
    let currentGroup = [indices[0]];

    for (let i = 1; i < indices.length; i++) {
      if (indices[i] === indices[i - 1] + 1) {
        currentGroup.push(indices[i]);
      } else {
        groups.push(currentGroup);
        currentGroup = [indices[i]];
      }
    }
    groups.push(currentGroup);

    for (const group of groups) {
      const start = group[0];
      const end = group[group.length - 1] + 1;

      result += text.slice(lastIndex, start);
      result += `<span class="search-highlight">${text.slice(start, end)}</span>`;
      lastIndex = end;
    }

    result += text.slice(lastIndex);
    return result;
  }

  // Initialize
  function init() {
    renderTree();
    bindEvents();
    bindNavigation();
  }

  // Bind navigation events
  function bindNavigation() {
    menuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const title = item.getAttribute('title');

        // Update active state
        menuItems.forEach(m => m.classList.remove('active'));
        item.classList.add('active');

        if (title === 'Dashboard') {
          switchToView('dashboard');
        } else if (title === 'Help Desk') {
          switchToView('helpdesk');
        }
      });
    });
  }

  // Switch between views
  function switchToView(view) {
    currentView = view;

    if (view === 'dashboard') {
      dashboardView.style.display = 'block';
      helpDeskView.style.display = 'none';
      renderDashboard();
    } else {
      dashboardView.style.display = 'none';
      helpDeskView.style.display = 'flex';
    }
  }

  // Render Dashboard
  function renderDashboard() {
    // Update summary cards
    const stats = DeviceData.getDashboardStats();
    document.getElementById('dashTotalRooms').textContent = stats.totalRooms;
    document.getElementById('dashHealthyRooms').textContent = stats.healthyRooms;
    document.getElementById('dashIssueRooms').textContent = stats.issueRooms;
    document.getElementById('dashAvgUptime').textContent = stats.avgUptime + '%';

    // Render problematic rooms table
    renderProblematicRoomsTable();

    // Render campus health grid
    renderCampusHealthGrid();
  }

  // Render Problematic Rooms Table
  function renderProblematicRoomsTable() {
    const problematicRooms = DeviceData.getProblematicRooms(10);
    const tbody = document.getElementById('problematicRoomsBody');

    if (!tbody) return;

    tbody.innerHTML = problematicRooms.map(room => {
      const lastIncidentDays = room.lastIncident
        ? Math.floor((new Date() - new Date(room.lastIncident)) / (1000 * 60 * 60 * 24))
        : null;

      const commonIssue = room.incidents.length > 0
        ? room.incidents[room.incidents.length - 1].issue
        : 'N/A';

      return `
        <tr class="${room.currentStatus === 'issue' ? 'current-issue' : ''}">
          <td><strong>${room.roomName}</strong></td>
          <td>${room.building}, ${room.campus}</td>
          <td>
            <span class="incident-count ${room.totalIncidents >= 5 ? 'high' : room.totalIncidents >= 3 ? 'medium' : ''}">
              ${room.totalIncidents}
            </span>
          </td>
          <td>
            <span class="uptime-badge ${room.uptimePercentage < 95 ? 'low' : room.uptimePercentage < 98 ? 'medium' : 'high'}">
              ${room.uptimePercentage}%
            </span>
          </td>
          <td>${commonIssue}</td>
          <td>${lastIncidentDays !== null ? lastIncidentDays + 'd ago' : 'N/A'}</td>
          <td>
            <span class="status-pill ${room.currentStatus}">${room.currentStatus === 'issue' ? 'Issue' : 'Healthy'}</span>
          </td>
        </tr>
      `;
    }).join('');

    if (problematicRooms.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="no-data">No problematic rooms found</td></tr>';
    }
  }

  // Render Campus Health Grid
  function renderCampusHealthGrid() {
    const campuses = DeviceData.getCampusHealthSummary();
    const grid = document.getElementById('campusHealthGrid');

    if (!grid) return;

    grid.innerHTML = campuses.map(campus => `
      <div class="campus-health-card">
        <div class="campus-header">
          <h4>${campus.name}</h4>
          <span class="campus-uptime ${parseFloat(campus.avgUptime) < 95 ? 'low' : ''}">${campus.avgUptime}% uptime</span>
        </div>
        <div class="campus-stats">
          <div class="campus-stat">
            <span class="stat-number">${campus.totalRooms}</span>
            <span class="stat-text">Rooms</span>
          </div>
          <div class="campus-stat healthy">
            <span class="stat-number">${campus.healthyRooms}</span>
            <span class="stat-text">Healthy</span>
          </div>
          <div class="campus-stat ${campus.totalRooms - campus.healthyRooms > 0 ? 'issues' : ''}">
            <span class="stat-number">${campus.totalRooms - campus.healthyRooms}</span>
            <span class="stat-text">Issues</span>
          </div>
          <div class="campus-stat">
            <span class="stat-number">${campus.totalIncidents}</span>
            <span class="stat-text">Incidents (30d)</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Render Room Health Chart
  function renderRoomHealthChart(roomId) {
    const healthData = DeviceData.getRoomHealth(roomId);
    const chartContainer = document.getElementById('healthChart');

    if (!chartContainer || !healthData) return;

    // Update stats
    document.getElementById('healthBadge').textContent = healthData.uptimePercentage + '% Uptime';
    document.getElementById('statIncidents').textContent = healthData.totalIncidents;
    document.getElementById('statMTTR').textContent = healthData.avgResolutionTime > 0 ? healthData.avgResolutionTime + 'm' : 'N/A';

    const lastIncidentDays = healthData.lastIncident
      ? Math.floor((new Date() - new Date(healthData.lastIncident)) / (1000 * 60 * 60 * 24))
      : null;
    document.getElementById('statLastIssue').textContent = lastIncidentDays !== null ? lastIncidentDays + 'd ago' : 'None';

    // Update health badge color
    const badge = document.getElementById('healthBadge');
    badge.className = 'health-badge';
    if (healthData.uptimePercentage < 95) {
      badge.classList.add('low');
    } else if (healthData.uptimePercentage < 98) {
      badge.classList.add('medium');
    } else {
      badge.classList.add('high');
    }

    // Render chart bars
    const barsContainer = chartContainer.querySelector('.chart-bars');
    if (barsContainer) {
      barsContainer.innerHTML = healthData.history.map(day => `
        <div class="chart-bar ${day.status}" title="${day.date}: ${day.status === 'issue' ? day.downtimeMinutes + 'm downtime' : 'Healthy'}"></div>
      `).join('');
    }
  }

  // Update Room At A Glance
  function updateRoomGlance(roomId) {
    // Simulated room state (in real app, this would come from the controller/TLP)
    const inputs = ['HDMI 1', 'HDMI 2', 'Wireless', 'USB-C'];
    const micStates = ['Active', 'Muted', 'Active', 'Active'];
    const displayStates = ['On', 'On', 'Standby', 'On'];

    // Random but consistent per room
    const hash = roomId.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    const idx = Math.abs(hash) % inputs.length;

    document.getElementById('glanceInput').textContent = inputs[idx];
    document.getElementById('glanceMic').textContent = micStates[idx];
    document.getElementById('glanceDisplay').textContent = displayStates[idx];
    document.getElementById('glanceVolume').textContent = (50 + (Math.abs(hash) % 40)) + '%';
    document.getElementById('glanceRecording').textContent = idx === 2 ? 'Recording' : 'Off';
    document.getElementById('glanceNetwork').textContent = 'Connected';

    // Update icon states
    const micIcon = document.querySelector('.glance-icon.mic-icon');
    if (micIcon) {
      micIcon.classList.toggle('active', micStates[idx] === 'Active');
      micIcon.classList.toggle('muted', micStates[idx] === 'Muted');
    }

    const recIcon = document.getElementById('glanceRecIcon');
    if (recIcon) {
      recIcon.classList.toggle('recording', idx === 2);
    }

    const displayIcon = document.querySelector('.glance-icon.display-icon');
    if (displayIcon) {
      displayIcon.classList.toggle('active', displayStates[idx] === 'On');
      displayIcon.classList.toggle('standby', displayStates[idx] === 'Standby');
    }
  }

  // Render Location Tree
  function renderTree() {
    const locations = DeviceData.locations;
    locationTree.innerHTML = locations.map(node => renderTreeNode(node)).join('');
  }

  // Check if a node matches the location search query
  function nodeMatchesSearch(node) {
    if (!locationSearchQuery) return { matches: true, indices: [] };

    // Check if this node's name matches
    const result = fuzzyMatch(node.name, locationSearchQuery);
    if (result.matches) return result;

    // Check if any children match
    if (node.children) {
      for (const child of node.children) {
        if (nodeMatchesSearch(child).matches) {
          return { matches: true, indices: [] }; // Parent matches because child matches
        }
      }
    }

    return { matches: false, indices: [] };
  }

  // Check if a node or any of its descendants match the current status filter
  function nodeMatchesFilter(node) {
    if (currentFilter === 'all') return true;

    // For rooms (leaf nodes), check their status directly
    if (node.type === 'room') {
      if (currentFilter === 'issues') return node.status === 'issue';
      if (currentFilter === 'healthy') return node.status === 'healthy';
    }

    // For parent nodes, check if any children match
    if (node.children) {
      return node.children.some(child => nodeMatchesFilter(child));
    }

    return false;
  }

  function renderTreeNode(node, depth = 0) {
    const hasChildren = node.children && node.children.length > 0;
    const isRoom = node.type === 'room';
    const isExpanded = node.expanded || (locationSearchQuery && nodeMatchesSearch(node).matches);
    const isSelected = node.id === selectedRoomId;
    const deviceCount = node.deviceCount ? node.deviceCount.total : 0;

    // Apply status filter
    if (!nodeMatchesFilter(node)) return '';

    // Apply search filter
    const searchResult = nodeMatchesSearch(node);
    if (!searchResult.matches) return '';

    // Get highlighted name
    const nameMatch = fuzzyMatch(node.name, locationSearchQuery);
    const displayName = nameMatch.matches && nameMatch.indices.length > 0
      ? highlightMatch(node.name, nameMatch.indices)
      : node.name;

    const childrenHtml = hasChildren
      ? `<div class="tree-children ${isExpanded ? 'expanded' : ''}" data-parent="${node.id}">
          ${node.children.map(child => renderTreeNode(child, depth + 1)).join('')}
        </div>`
      : '';

    return `
      <div class="tree-node" data-id="${node.id}" data-type="${node.type}">
        <div class="tree-node-content ${isRoom ? '' : 'non-selectable'} ${isSelected ? 'selected' : ''}"
             data-id="${node.id}"
             data-type="${node.type}"
             data-expanded="${isExpanded}">
          <span class="expand-icon ${isExpanded ? 'expanded' : ''} ${!hasChildren ? 'hidden' : ''}">${icons.chevron}</span>
          <span class="status-indicator ${node.status}"></span>
          <span class="node-icon">${icons[node.type]}</span>
          <span class="node-name">${displayName}</span>
          <span class="node-count">${deviceCount}</span>
        </div>
        ${childrenHtml}
      </div>
    `;
  }

  // Bind Events
  function bindEvents() {
    // Tree click handler
    locationTree.addEventListener('click', handleTreeClick);

    // Status filter
    statusFilter.addEventListener('change', (e) => {
      currentFilter = e.target.value;
      renderTree();
    });

    // Location search
    locationSearch.addEventListener('input', (e) => {
      locationSearchQuery = e.target.value;
      renderTree();
    });

    // Expand/Collapse toggle
    expandToggle.addEventListener('click', toggleExpandAll);

    // Device search
    deviceSearch.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      renderDeviceTable();
    });

    // Select all checkbox
    selectAllCheckbox.addEventListener('change', handleSelectAll);

    // Inline bulk action button
    inlineBulkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (selectedDevices.size > 0) {
        inlineBulkMenu.classList.toggle('visible');
      }
    });

    // Inline bulk menu items
    inlineBulkMenu.querySelectorAll('.bulk-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        handleBulkAction(action);
        inlineBulkMenu.classList.remove('visible');
      });
    });

    // Close bulk menu on outside click
    document.addEventListener('click', () => {
      inlineBulkMenu.classList.remove('visible');
    });

    // Table sorting
    document.querySelectorAll('.device-table th[data-sort]').forEach(th => {
      th.addEventListener('click', () => handleSort(th.dataset.sort));
    });

    // Modal close
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
        inlineBulkMenu.classList.remove('visible');
        closeControlPanel();
      }
    });

    // Panel close button
    if (panelCloseBtn) {
      panelCloseBtn.addEventListener('click', closeControlPanel);
    }

    // Panel control buttons (for demo feedback)
    document.querySelectorAll('.control-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showToast('Command sent successfully', 'success');
      });
    });

    // Input selector buttons
    document.querySelectorAll('.input-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.input-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        showToast(`Switched to Input ${e.currentTarget.dataset.input}`, 'success');
      });
    });

    // Power toggle buttons
    document.querySelectorAll('.power-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const toggle = e.currentTarget;
        const isOn = toggle.classList.contains('on');
        const control = toggle.dataset.control;

        toggle.classList.toggle('on');
        toggle.classList.toggle('off');

        const statusEl = toggle.querySelector('.toggle-status');
        if (control === 'power') {
          statusEl.textContent = isOn ? 'OFF' : 'ON';
        } else if (control === 'mic') {
          statusEl.textContent = isOn ? 'MUTED' : 'ACTIVE';
        } else if (control === 'recording') {
          statusEl.textContent = isOn ? 'OFF' : 'REC';
          if (!isOn) toggle.classList.add('recording');
          else toggle.classList.remove('recording');
        }

        showToast(`${control.charAt(0).toUpperCase() + control.slice(1)} ${isOn ? 'disabled' : 'enabled'}`, 'success');
      });
    });
  }

  // Handle Tree Click
  function handleTreeClick(e) {
    const nodeContent = e.target.closest('.tree-node-content');
    if (!nodeContent) return;

    const nodeId = nodeContent.dataset.id;
    const nodeType = nodeContent.dataset.type;
    const isExpanded = nodeContent.dataset.expanded === 'true';

    if (nodeType === 'room') {
      // Select room
      selectRoom(nodeId);
    } else {
      // Toggle expand/collapse
      toggleNode(nodeId, !isExpanded);
    }
  }

  // Toggle Node Expand/Collapse
  function toggleNode(nodeId, expand) {
    const node = findNodeById(nodeId, DeviceData.locations);
    if (node) {
      node.expanded = expand;
    }

    // Update DOM
    const nodeContent = document.querySelector(`.tree-node-content[data-id="${nodeId}"]`);
    const expandIcon = nodeContent.querySelector('.expand-icon');
    const children = document.querySelector(`.tree-children[data-parent="${nodeId}"]`);

    if (nodeContent) nodeContent.dataset.expanded = expand;
    if (expandIcon) expandIcon.classList.toggle('expanded', expand);
    if (children) children.classList.toggle('expanded', expand);
  }

  // Find Node by ID
  function findNodeById(id, nodes) {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(id, node.children);
        if (found) return found;
      }
    }
    return null;
  }

  // Toggle Expand All
  function toggleExpandAll() {
    allExpanded = !allExpanded;
    expandToggle.textContent = allExpanded ? 'Collapse All' : 'Expand All';

    function setExpanded(nodes, expanded) {
      for (const node of nodes) {
        if (node.children) {
          node.expanded = expanded;
          setExpanded(node.children, expanded);
        }
      }
    }

    setExpanded(DeviceData.locations, allExpanded);
    renderTree();
  }

  // Select Room
  function selectRoom(roomId) {
    selectedRoomId = roomId;
    selectedDevices.clear();

    // Update tree selection
    document.querySelectorAll('.tree-node-content.selected').forEach(el => {
      el.classList.remove('selected');
    });
    const selectedNode = document.querySelector(`.tree-node-content[data-id="${roomId}"]`);
    if (selectedNode) selectedNode.classList.add('selected');

    // Show room view
    emptyState.style.display = 'none';
    roomView.style.display = 'flex';
    roomView.style.flexDirection = 'column';

    // Render room details
    renderRoomHeader(roomId);
    renderDeviceTable();
    updateBulkActions();

    // Render room health and glance
    renderRoomHealthChart(roomId);
    updateRoomGlance(roomId);
  }

  // Render Room Header
  function renderRoomHeader(roomId) {
    const room = DeviceData.findRoomById(roomId);
    const breadcrumbPath = DeviceData.getBreadcrumb(roomId);

    // Render breadcrumb
    breadcrumb.innerHTML = breadcrumbPath.map((name, index) => {
      const isLast = index === breadcrumbPath.length - 1;
      return `
        <span class="breadcrumb-item ${isLast ? 'current' : ''}">${name}</span>
        ${!isLast ? '<span class="breadcrumb-separator">›</span>' : ''}
      `;
    }).join('');

    // Render device counts
    const counts = room.deviceCount;
    deviceCounts.innerHTML = `
      <div class="count-item controller">
        <span class="count-value">${counts.controller}</span>
        <span class="count-label">Controllers</span>
      </div>
      <div class="count-item tlp">
        <span class="count-value">${counts.tlp}</span>
        <span class="count-label">TLPs</span>
      </div>
      <div class="count-item managed">
        <span class="count-value">${counts.managed}</span>
        <span class="count-label">Managed</span>
      </div>
      <div class="count-item onboarded">
        <span class="count-value">${counts.onboarded}</span>
        <span class="count-label">Onboarded</span>
      </div>
      <div class="count-item discovered">
        <span class="count-value">${counts.discovered}</span>
        <span class="count-label">Discovered</span>
      </div>
    `;
  }

  // Render Device Table
  function renderDeviceTable() {
    const room = DeviceData.findRoomById(selectedRoomId);
    if (!room || !room.devices) return;

    let devices = [...room.devices];

    // Apply search filter
    if (searchQuery) {
      devices = devices.filter(d =>
        d.hostname.toLowerCase().includes(searchQuery) ||
        d.ipAddress.toLowerCase().includes(searchQuery) ||
        d.model.toLowerCase().includes(searchQuery) ||
        d.serialNumber.toLowerCase().includes(searchQuery)
      );
    }

    // Apply sorting (only if not searching - preserve grouping when not searching)
    if (sortColumn && !searchQuery) {
      // Separate devices by type for grouped sorting
      const controllers = devices.filter(d => d.type === 'controller');
      const managedDevices = devices.filter(d => d.type === 'managed');
      const otherDevices = devices.filter(d => d.type !== 'controller' && d.type !== 'managed');

      const sortFn = (a, b) => {
        let valA, valB;

        switch (sortColumn) {
          case 'type':
            valA = a.type;
            valB = b.type;
            break;
          case 'hostname':
            valA = a.hostname;
            valB = b.hostname;
            break;
          case 'ipAddress':
            valA = a.ipAddress;
            valB = b.ipAddress;
            break;
          case 'status':
            valA = a.status || 'zzz'; // N/A sorts last
            valB = b.status || 'zzz';
            break;
          case 'firmware':
            valA = a.firmware || 'zzz';
            valB = b.firmware || 'zzz';
            break;
          case 'alerts':
            valA = a.alerts ? a.alerts.length : 0;
            valB = b.alerts ? b.alerts.length : 0;
            break;
          default:
            return 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      };

      otherDevices.sort(sortFn);

      // Keep controller + managed grouped together, then other devices
      devices = [...controllers, ...managedDevices, ...otherDevices];
    } else if (!searchQuery) {
      // Default grouping: Controller with its managed devices first, then others
      const controllers = devices.filter(d => d.type === 'controller');
      const managedDevices = devices.filter(d => d.type === 'managed');
      const otherDevices = devices.filter(d => d.type !== 'controller' && d.type !== 'managed');
      devices = [...controllers, ...managedDevices, ...otherDevices];
    }

    deviceTableBody.innerHTML = devices.map((device, index, arr) => {
      // Check if this is the first managed device (to add group separator)
      const isFirstManaged = device.type === 'managed' &&
        (index === 0 || arr[index - 1].type !== 'managed');
      // Check if previous was controller (managed follows controller)
      const followsController = index > 0 && arr[index - 1].type === 'controller';

      return renderDeviceRow(device, followsController || (device.type === 'managed' && !isFirstManaged));
    }).join('');

    // Bind row events
    deviceTableBody.querySelectorAll('.device-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', handleDeviceSelect);
    });

    deviceTableBody.querySelectorAll('.alert-badge').forEach(badge => {
      badge.addEventListener('click', (e) => {
        const deviceId = e.currentTarget.dataset.deviceId;
        openDeviceModal(deviceId);
      });
    });

    // Bind action panel buttons
    deviceTableBody.querySelectorAll('.action-panel-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const deviceId = btn.dataset.deviceId;
        const panelType = btn.dataset.panelType;

        // Toggle if clicking same device
        if (activePanelDeviceId === deviceId) {
          closeControlPanel();
        } else {
          openControlPanel(deviceId, panelType);
        }
      });
    });

    // Update button states if panel is open
    if (activePanelDeviceId) {
      updateActionButtonStates(activePanelDeviceId);
    }

    // Update select all state
    updateSelectAllState();
  }

  // Device types that are actively monitored (have status/alerts)
  const MONITORED_TYPES = ['controller', 'tlp', 'managed', 'onboarded'];

  // Device types that can be selected for bulk actions
  const SELECTABLE_TYPES = ['controller', 'tlp', 'managed', 'onboarded'];

  // Render Device Row
  function renderDeviceRow(device, isGrouped = false) {
    const isMonitored = MONITORED_TYPES.includes(device.type);
    const isSelectable = SELECTABLE_TYPES.includes(device.type);

    // Check for critical issues (not firmware updates)
    const hasCriticalIssue = isMonitored && (
      device.status === 'offline' ||
      (device.alerts && device.alerts.some(a => a.severity === 'critical' && !a.isFirmwareUpdate))
    );

    const isSelected = selectedDevices.has(device.id);
    const isAssociated = device.associatedTo ? true : false;

    // Connection status icon
    let connectionStatus;
    if (!isMonitored) {
      connectionStatus = '<span class="connection-icon na" title="N/A">—</span>';
    } else if (device.status === 'online') {
      connectionStatus = '<span class="connection-icon online" title="Online">●</span>';
    } else {
      connectionStatus = '<span class="connection-icon offline" title="Offline">●</span>';
    }

    // Alert badge
    let alertBadge = '<span class="no-alerts">—</span>';
    if (device.alerts && device.alerts.length > 0) {
      const hasCritical = device.alerts.some(a => a.severity === 'critical');
      const hasWarning = device.alerts.some(a => a.severity === 'warning');
      const severity = hasCritical && hasWarning ? 'mixed' : (hasCritical ? 'critical' : 'warning');
      const icon = hasCritical ? '🔴' : '🟡';
      alertBadge = `<span class="alert-badge ${severity}" data-device-id="${device.id}">${icon} ${device.alerts.length}</span>`;
    }

    // Firmware version with update indicator
    let firmwareCell;
    if (isMonitored && device.firmware) {
      firmwareCell = `
        <div class="firmware-cell">
          <span class="firmware-version">${device.firmware}</span>
          ${device.hasFirmwareUpdate ? `<span class="firmware-update-available"><span class="firmware-update-dot"></span> Update</span>` : ''}
        </div>
      `;
    } else {
      firmwareCell = '<span class="firmware-na">—</span>';
    }

    // Association indicator for managed devices
    const associationIndicator = isAssociated
      ? '<span class="association-indicator" title="Associated to Controller">↳</span>'
      : '';

    // Determine device icon
    let deviceIcon = '';
    if (device.type === 'controller') {
      deviceIcon = deviceIcons.controller;
    } else if (device.type === 'tlp') {
      deviceIcon = deviceIcons.tlp;
    } else if (device.type === 'onboarded') {
      deviceIcon = deviceIcons.onboarded;
    } else if (device.type === 'discovered') {
      deviceIcon = deviceIcons.discovered;
    } else if (device.type === 'managed') {
      // Alternate between projector and microphone based on hostname
      // MGD1 = projector, MGD2 = microphone
      deviceIcon = device.hostname.includes('MGD1') ? deviceIcons.projector : deviceIcons.microphone;
    }

    // Row classes
    const rowClasses = [
      hasCriticalIssue ? 'has-issue' : '',
      device.type === 'discovered' ? 'discovered' : '',
      device.type === 'controller' ? 'controller-row' : '',
      device.type === 'managed' ? 'managed-row associated' : '',
      isGrouped ? 'grouped-device' : ''
    ].filter(Boolean).join(' ');

    return `
      <tr class="${rowClasses}" data-device-type="${device.type}">
        <td class="checkbox-cell">
          <input type="checkbox"
                 class="device-checkbox"
                 data-device-id="${device.id}"
                 ${!isSelectable ? 'disabled' : ''}
                 ${isSelected ? 'checked' : ''}>
        </td>
        <td>
          ${associationIndicator}
          <span class="type-badge ${device.type}">${device.type}</span>
        </td>
        <td class="status-cell">
          ${connectionStatus}
        </td>
        <td>
          <div class="device-info">
            <span class="device-icon">${deviceIcon}</span>
            <div class="device-details">
              <span class="device-hostname">${device.hostname}</span>
              <span class="device-model">${device.model}</span>
              <span class="device-serial">${device.serialNumber}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="ip-address">${device.ipAddress}</span>
        </td>
        <td>${firmwareCell}</td>
        <td>${alertBadge}</td>
        <td class="actions-cell">
          ${device.type === 'controller' ? `
            <button class="action-panel-btn controller-action" data-device-id="${device.id}" data-panel-type="controller" title="Open Control Panel">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
              <span>Control Panel</span>
              <span class="btn-arrow">→</span>
            </button>
          ` : ''}
          ${device.type === 'tlp' ? `
            <button class="action-panel-btn tlp-action" data-device-id="${device.id}" data-panel-type="vtlp" title="Open Virtual TLP">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12" y2="18.01"></line></svg>
              <span>VTLP</span>
              <span class="btn-arrow">→</span>
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  }

  // Handle Device Selection
  function handleDeviceSelect(e) {
    const deviceId = e.target.dataset.deviceId;
    if (e.target.checked) {
      selectedDevices.add(deviceId);
    } else {
      selectedDevices.delete(deviceId);
    }
    updateBulkActions();
    updateSelectAllState();
  }

  // Handle Select All
  function handleSelectAll(e) {
    const room = DeviceData.findRoomById(selectedRoomId);
    if (!room || !room.devices) return;

    const selectableDevices = room.devices.filter(d => SELECTABLE_TYPES.includes(d.type));

    if (e.target.checked) {
      selectableDevices.forEach(d => selectedDevices.add(d.id));
    } else {
      selectableDevices.forEach(d => selectedDevices.delete(d.id));
    }

    renderDeviceTable();
    updateBulkActions();
  }

  // Update Select All State
  function updateSelectAllState() {
    const room = DeviceData.findRoomById(selectedRoomId);
    if (!room || !room.devices) return;

    const selectableDevices = room.devices.filter(d => SELECTABLE_TYPES.includes(d.type));
    const selectedCount = selectableDevices.filter(d => selectedDevices.has(d.id)).length;

    selectAllCheckbox.checked = selectedCount === selectableDevices.length && selectableDevices.length > 0;
    selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < selectableDevices.length;
  }

  // Update Bulk Actions
  function updateBulkActions() {
    const count = selectedDevices.size;
    inlineSelectedCount.textContent = count;
    // Toggle active state based on selection
    if (count > 0) {
      inlineBulkActions.classList.add('has-selection');
    } else {
      inlineBulkActions.classList.remove('has-selection');
    }
  }

  // Handle Bulk Action
  function handleBulkAction(action) {
    const count = selectedDevices.size;
    const actionName = action === 'reboot' ? 'Reboot' : 'Firmware Update';

    showToast(`${actionName} initiated for ${count} device${count > 1 ? 's' : ''}`, 'success');

    // Clear selection
    selectedDevices.clear();
    renderDeviceTable();
    updateBulkActions();
  }

  // Handle Sort
  function handleSort(column) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }

    // Update sort indicators
    document.querySelectorAll('.device-table th').forEach(th => {
      th.classList.remove('sorted');
      const icon = th.querySelector('.sort-icon');
      if (icon) icon.textContent = '↕';
    });

    const currentTh = document.querySelector(`.device-table th[data-sort="${column}"]`);
    if (currentTh) {
      currentTh.classList.add('sorted');
      const icon = currentTh.querySelector('.sort-icon');
      if (icon) icon.textContent = sortDirection === 'asc' ? '↑' : '↓';
    }

    renderDeviceTable();
  }

  // Open Device Modal
  function openDeviceModal(deviceId) {
    const allDevices = DeviceData.getAllDevices();
    const device = allDevices.find(d => d.id === deviceId);

    if (device) {
      modalTitle.textContent = `Device: ${device.hostname}`;
      modalBody.innerHTML = `
        <div class="modal-placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <p><strong>Device Details - Coming Soon</strong></p>
          <p style="margin-top: 12px; font-size: 12px; color: var(--text-muted);">
            IP: ${device.ipAddress}<br>
            Model: ${device.model}<br>
            Serial: ${device.serialNumber}<br>
            Alerts: ${device.alerts ? device.alerts.length : 0}
          </p>
        </div>
      `;
    }

    modalOverlay.classList.add('visible');
  }

  // Close Modal
  function closeModal() {
    modalOverlay.classList.remove('visible');
  }

  // Open Control Panel
  function openControlPanel(deviceId, panelType) {
    const allDevices = DeviceData.getAllDevices();
    const device = allDevices.find(d => d.id === deviceId);

    if (!device) return;

    // Set active device
    activePanelDeviceId = deviceId;

    // Update panel header
    panelDeviceName.textContent = device.hostname;
    panelDeviceType.textContent = panelType === 'controller' ? 'Control Panel' : 'Virtual Touchlink Panel';

    // Set device icon
    if (panelType === 'controller') {
      panelDeviceIcon.innerHTML = deviceIcons.controller;
      controllerPanelContent.style.display = 'block';
      vtlpPanelContent.style.display = 'none';
    } else {
      panelDeviceIcon.innerHTML = deviceIcons.tlp;
      controllerPanelContent.style.display = 'none';
      vtlpPanelContent.style.display = 'block';
    }

    // Show panel and compress table
    controlPanelPopout.classList.add('open');
    if (tablePanelWrapper) {
      tablePanelWrapper.classList.add('panel-open');
    }

    // Update active button state
    updateActionButtonStates(deviceId);
  }

  // Close Control Panel
  function closeControlPanel() {
    activePanelDeviceId = null;
    controlPanelPopout.classList.remove('open');
    if (tablePanelWrapper) {
      tablePanelWrapper.classList.remove('panel-open');
    }

    // Clear active button states
    updateActionButtonStates(null);
  }

  // Update action button states
  function updateActionButtonStates(activeDeviceId) {
    document.querySelectorAll('.action-panel-btn').forEach(btn => {
      if (btn.dataset.deviceId === activeDeviceId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Show Toast
  function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('visible');

    setTimeout(() => {
      toast.classList.remove('visible');
    }, 3000);
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', init);
})();
