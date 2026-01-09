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
  const bulkActions = document.getElementById('bulkActions');
  const bulkActionBtn = document.getElementById('bulkActionBtn');
  const bulkMenu = document.getElementById('bulkMenu');
  const selectedCount = document.getElementById('selectedCount');
  const deviceSearch = document.getElementById('deviceSearch');
  const deviceTableBody = document.getElementById('deviceTableBody');
  const selectAllCheckbox = document.getElementById('selectAll');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  // Icons
  const icons = {
    country: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
    city: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="21" x2="21" y2="21"></line><path d="M5 21V7l8-4v18"></path><path d="M19 21V11l-6-4"></path><line x1="9" y1="9" x2="9" y2="9.01"></line><line x1="9" y1="12" x2="9" y2="12.01"></line><line x1="9" y1="15" x2="9" y2="15.01"></line><line x1="9" y1="18" x2="9" y2="18.01"></line></svg>`,
    building: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="6" x2="9" y2="6.01"></line><line x1="15" y1="6" x2="15" y2="6.01"></line><line x1="9" y1="10" x2="9" y2="10.01"></line><line x1="15" y1="10" x2="15" y2="10.01"></line><line x1="9" y1="14" x2="9" y2="14.01"></line><line x1="15" y1="14" x2="15" y2="14.01"></line><line x1="9" y1="18" x2="15" y2="18"></line></svg>`,
    floor: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`,
    room: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
    chevron: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`
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

    // Bulk action button
    bulkActionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      bulkMenu.classList.toggle('visible');
    });

    // Bulk menu items
    bulkMenu.querySelectorAll('.bulk-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        handleBulkAction(action);
        bulkMenu.classList.remove('visible');
      });
    });

    // Close bulk menu on outside click
    document.addEventListener('click', () => {
      bulkMenu.classList.remove('visible');
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
        bulkMenu.classList.remove('visible');
      }
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
      <div class="count-item managed">
        <span class="count-value">${counts.managed}</span>
        <span class="count-label">Managed</span>
      </div>
      <div class="count-item discovered">
        <span class="count-value">${counts.discovered}</span>
        <span class="count-label">Discovered</span>
      </div>
      <div class="count-item total">
        <span class="count-value">${counts.total}</span>
        <span class="count-label">Total</span>
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

    // Apply sorting
    if (sortColumn) {
      devices.sort((a, b) => {
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
      });
    }

    deviceTableBody.innerHTML = devices.map(device => renderDeviceRow(device)).join('');

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

    // Update select all state
    updateSelectAllState();
  }

  // Render Device Row
  function renderDeviceRow(device) {
    const isManaged = device.type === 'managed';
    const hasIssue = isManaged && (device.status === 'offline' || (device.alerts && device.alerts.length > 0));
    const isSelected = selectedDevices.has(device.id);

    // Connection status icon
    let connectionStatus;
    if (!isManaged) {
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

    return `
      <tr class="${hasIssue ? 'has-issue' : ''} ${!isManaged ? 'discovered' : ''}">
        <td class="checkbox-cell">
          <input type="checkbox"
                 class="device-checkbox"
                 data-device-id="${device.id}"
                 ${!isManaged ? 'disabled' : ''}
                 ${isSelected ? 'checked' : ''}>
        </td>
        <td>
          <span class="type-badge ${device.type}">${device.type}</span>
        </td>
        <td class="connection-cell">
          ${connectionStatus}
        </td>
        <td>
          <div class="device-info">
            <span class="device-hostname">${device.hostname}</span>
            <span class="device-model">${device.model}</span>
            <span class="device-serial">${device.serialNumber}</span>
          </div>
        </td>
        <td>
          <span class="ip-address">${device.ipAddress}</span>
        </td>
        <td>${alertBadge}</td>
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

    const managedDevices = room.devices.filter(d => d.type === 'managed');

    if (e.target.checked) {
      managedDevices.forEach(d => selectedDevices.add(d.id));
    } else {
      managedDevices.forEach(d => selectedDevices.delete(d.id));
    }

    renderDeviceTable();
    updateBulkActions();
  }

  // Update Select All State
  function updateSelectAllState() {
    const room = DeviceData.findRoomById(selectedRoomId);
    if (!room || !room.devices) return;

    const managedDevices = room.devices.filter(d => d.type === 'managed');
    const selectedManagedCount = managedDevices.filter(d => selectedDevices.has(d.id)).length;

    selectAllCheckbox.checked = selectedManagedCount === managedDevices.length && managedDevices.length > 0;
    selectAllCheckbox.indeterminate = selectedManagedCount > 0 && selectedManagedCount < managedDevices.length;
  }

  // Update Bulk Actions
  function updateBulkActions() {
    const count = selectedDevices.size;
    selectedCount.textContent = count;
    bulkActions.style.display = count > 0 ? 'flex' : 'none';
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
