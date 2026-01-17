// Device Management Platform - Mock Data Generator
// Generates hierarchical location data with devices for higher education

// School profile
const SCHOOL_PROFILE = {
  name: 'DanU',
  fullName: 'Dan University',
  type: 'Higher Education',
  campuses: [
    {
      name: 'Raleigh Campus',
      buildings: ['Copeland Hall', 'Baker Hall', 'Jefferson Hall', 'Scripps Hall']
    },
    {
      name: 'Anaheim Campus',
      buildings: ['Schoonover Center', 'Morrison Hall', 'Thompson Library', 'Ellis Hall']
    }
  ]
};

// Room numbers per building (no floors - room number indicates floor)
const ROOM_NUMBERS = ['Room 101', 'Room 102', 'Room 103', 'Room 104', 'Room 105',
                      'Room 201', 'Room 202', 'Room 203', 'Room 204', 'Room 205'];

// Device definitions - each room has these exact devices
// Device types: controller, tlp, onboarded, discovered, managed
// Managed devices are associated with the controller
const ROOM_DEVICES = [
  { model: 'Controller', type: 'controller', prefix: 'CTL' },
  { model: 'Managed Device', type: 'managed', prefix: 'MGD', associatedTo: 'controller' },
  { model: 'Managed Device', type: 'managed', prefix: 'MGD', associatedTo: 'controller' },
  { model: 'TLP', type: 'tlp', prefix: 'TLP' },
  { model: 'Onboarded Device', type: 'onboarded', prefix: 'ONB' },
  { model: 'Discovered Device', type: 'discovered', prefix: 'DSC' }
];

// Alert types - firmware update is warning only, doesn't cause red status
const ALERT_TYPES_CRITICAL = [
  { severity: 'critical', message: 'High CPU utilization (>95%)' },
  { severity: 'critical', message: 'Memory exhaustion imminent' },
  { severity: 'critical', message: 'Power supply failure' },
  { severity: 'critical', message: 'Fan failure detected' }
];

const ALERT_TYPES_WARNING = [
  { severity: 'warning', message: 'Interface errors detected' },
  { severity: 'warning', message: 'High temperature warning' },
  { severity: 'warning', message: 'Certificate expiring soon' },
  { severity: 'warning', message: 'Port flapping detected' }
];

// Firmware update alert - separate, doesn't affect room status
const FIRMWARE_UPDATE_ALERT = { severity: 'warning', message: 'Firmware update available', isFirmwareUpdate: true };

// Helper functions
function generateSerialNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let serial = '';
  for (let i = 0; i < 3; i++) serial += chars.charAt(Math.floor(Math.random() * 26));
  for (let i = 0; i < 8; i++) serial += chars.charAt(Math.floor(Math.random() * chars.length));
  return serial;
}

function generateMAC() {
  const hex = '0123456789ABCDEF';
  let mac = '';
  for (let i = 0; i < 6; i++) {
    if (i > 0) mac += ':';
    mac += hex.charAt(Math.floor(Math.random() * 16));
    mac += hex.charAt(Math.floor(Math.random() * 16));
  }
  return mac;
}

function generateHostname(prefix, building, roomNum) {
  // Create short building code from building name
  const buildingCode = building.split(' ')[0].toLowerCase().substring(0, 4);
  return `${prefix}-${buildingCode}-${roomNum}`;
}

function generateIP(baseOctet, deviceIndex) {
  return `10.${baseOctet}.${Math.floor(deviceIndex / 254)}.${(deviceIndex % 254) + 1}`;
}

// Device types that can have status and alerts (actively monitored)
const MONITORED_TYPES = ['controller', 'tlp', 'managed', 'onboarded'];

// Buildings that should always be healthy (green status)
const HEALTHY_BUILDINGS = ['Copeland Hall', 'Schoonover Center'];

// Generate device data - creates 6 devices per room
function generateDevices(schoolName, campusName, buildingName, roomName, roomIndex, ipBase) {
  const devices = [];
  const roomNum = roomName.replace('Room ', '');

  // Check if this building should always be healthy
  const forceHealthy = HEALTHY_BUILDINGS.includes(buildingName);

  // Generate controller ID first for association
  const controllerDeviceIndex = roomIndex * ROOM_DEVICES.length;
  const controllerId = `device-${controllerDeviceIndex}`;

  ROOM_DEVICES.forEach((deviceDef, i) => {
    const deviceIndex = roomIndex * ROOM_DEVICES.length + i;
    const isMonitored = MONITORED_TYPES.includes(deviceDef.type);

    // For healthy buildings: always online. Otherwise: 95% online, 5% offline
    const isOnline = isMonitored ? (forceHealthy ? true : Math.random() > 0.05) : null;

    // Generate alerts less frequently - ~10% of monitored devices (skip for healthy buildings)
    const alerts = [];
    if (isMonitored && !forceHealthy && Math.random() < 0.10) {
      // Decide if it's a critical or warning alert
      if (Math.random() < 0.3) {
        // 30% chance of critical alert
        const alertType = ALERT_TYPES_CRITICAL[Math.floor(Math.random() * ALERT_TYPES_CRITICAL.length)];
        alerts.push({
          id: `alert-${deviceIndex}-0`,
          ...alertType,
          timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
        });
      } else {
        // 70% chance of warning alert
        const alertType = ALERT_TYPES_WARNING[Math.floor(Math.random() * ALERT_TYPES_WARNING.length)];
        alerts.push({
          id: `alert-${deviceIndex}-0`,
          ...alertType,
          timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
        });
      }
    }

    // Separate firmware update alerts (~15% of monitored devices) - doesn't cause red status
    // Allow firmware updates even in healthy buildings
    const hasFirmwareUpdate = isMonitored && Math.random() < 0.15;
    if (hasFirmwareUpdate) {
      alerts.push({
        id: `alert-${deviceIndex}-fw`,
        ...FIRMWARE_UPDATE_ALERT,
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString()
      });
    }

    // Force some issues in specific rooms to ensure some red statuses (but less often)
    // Skip for healthy buildings
    const forceIssue = !forceHealthy && roomIndex % 12 === 0 && i === 0;

    // Add unique suffix for managed devices (they share the same prefix)
    const hostname = deviceDef.type === 'managed'
      ? generateHostname(`${deviceDef.prefix}${i}`, buildingName, roomNum)
      : generateHostname(deviceDef.prefix, buildingName, roomNum);

    const device = {
      id: `device-${deviceIndex}`,
      hostname: hostname,
      model: deviceDef.model,
      serialNumber: generateSerialNumber(),
      macAddress: generateMAC(),
      ipAddress: generateIP(ipBase, i),
      type: deviceDef.type,
      status: isMonitored ? (forceIssue ? 'offline' : (isOnline ? 'online' : 'offline')) : null,
      alerts: forceIssue && !alerts.some(a => a.severity === 'critical') && isMonitored ? [{
        id: `alert-${deviceIndex}-forced`,
        severity: 'critical',
        message: 'Device unreachable',
        timestamp: new Date().toISOString()
      }, ...alerts] : alerts,
      lastSeen: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      firmware: `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}`,
      hasFirmwareUpdate: hasFirmwareUpdate,
      location: {
        school: schoolName,
        campus: campusName,
        building: buildingName,
        room: roomName
      }
    };

    // Add controller association for managed devices
    if (deviceDef.associatedTo === 'controller') {
      device.associatedTo = controllerId;
    }

    devices.push(device);
  });

  return devices;
}

// Calculate status based on devices - firmware updates don't cause red status
function calculateStatus(devices) {
  if (!devices || devices.length === 0) return 'healthy';

  const hasIssue = devices.some(d => {
    // Check monitored device types for issues
    if (MONITORED_TYPES.includes(d.type)) {
      // Offline is always an issue
      if (d.status === 'offline') return true;
      // Check for non-firmware alerts (critical or warning that aren't firmware updates)
      if (d.alerts && d.alerts.length > 0) {
        return d.alerts.some(alert => !alert.isFirmwareUpdate && alert.severity === 'critical');
      }
    }
    return false;
  });

  return hasIssue ? 'issue' : 'healthy';
}

// Aggregate status from children
function aggregateStatus(children) {
  if (!children || children.length === 0) return 'healthy';
  return children.some(c => c.status === 'issue') ? 'issue' : 'healthy';
}

// Count devices in subtree by type
function countDevices(node) {
  if (node.devices) {
    return {
      total: node.devices.length,
      controller: node.devices.filter(d => d.type === 'controller').length,
      tlp: node.devices.filter(d => d.type === 'tlp').length,
      managed: node.devices.filter(d => d.type === 'managed').length,
      onboarded: node.devices.filter(d => d.type === 'onboarded').length,
      discovered: node.devices.filter(d => d.type === 'discovered').length
    };
  }

  if (node.children) {
    return node.children.reduce((acc, child) => {
      const childCount = countDevices(child);
      return {
        total: acc.total + childCount.total,
        controller: acc.controller + childCount.controller,
        tlp: acc.tlp + childCount.tlp,
        managed: acc.managed + childCount.managed,
        onboarded: acc.onboarded + childCount.onboarded,
        discovered: acc.discovered + childCount.discovered
      };
    }, { total: 0, controller: 0, tlp: 0, managed: 0, onboarded: 0, discovered: 0 });
  }

  return { total: 0, controller: 0, tlp: 0, managed: 0, onboarded: 0, discovered: 0 };
}

// Generate the full hierarchy
function generateLocationHierarchy() {
  let roomIndex = 0;
  let ipBase = 10;

  // Single school node at the top
  const schoolNode = {
    id: `school-${SCHOOL_PROFILE.name.toLowerCase()}`,
    name: SCHOOL_PROFILE.name,
    fullName: SCHOOL_PROFILE.fullName,
    type: 'school',
    expanded: true,
    children: SCHOOL_PROFILE.campuses.map(campus => {
      const campusNode = {
        id: `campus-${campus.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: campus.name,
        type: 'campus',
        expanded: false,
        children: campus.buildings.map(buildingName => {
          const buildingNode = {
            id: `building-${campus.name.toLowerCase().replace(/\s+/g, '-')}-${buildingName.toLowerCase().replace(/\s+/g, '-')}`,
            name: buildingName,
            type: 'building',
            expanded: false,
            children: ROOM_NUMBERS.map(roomName => {
              const devices = generateDevices(
                SCHOOL_PROFILE.name,
                campus.name,
                buildingName,
                roomName,
                roomIndex++,
                ipBase++
              );

              return {
                id: `room-${campus.name.toLowerCase().replace(/\s+/g, '-')}-${buildingName.toLowerCase().replace(/\s+/g, '-')}-${roomName.toLowerCase().replace(/\s+/g, '')}`,
                name: roomName,
                type: 'room',
                devices: devices,
                status: calculateStatus(devices),
                deviceCount: countDevices({ devices })
              };
            })
          };

          // Calculate building status and device count
          buildingNode.status = aggregateStatus(buildingNode.children);
          buildingNode.deviceCount = countDevices(buildingNode);

          return buildingNode;
        })
      };

      // Calculate campus status and device count
      campusNode.status = aggregateStatus(campusNode.children);
      campusNode.deviceCount = countDevices(campusNode);

      return campusNode;
    })
  };

  // Calculate school status and device count
  schoolNode.status = aggregateStatus(schoolNode.children);
  schoolNode.deviceCount = countDevices(schoolNode);

  return [schoolNode];
}

// Export the data
const locationData = generateLocationHierarchy();

// Helper to find a room by ID
function findRoomById(id, nodes = locationData) {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findRoomById(id, node.children);
      if (found) return found;
    }
  }
  return null;
}

// Helper to get breadcrumb path for a room
function getBreadcrumb(roomId, nodes = locationData, path = []) {
  for (const node of nodes) {
    const currentPath = [...path, node.name];
    if (node.id === roomId) return currentPath;
    if (node.children) {
      const found = getBreadcrumb(roomId, node.children, currentPath);
      if (found) return found;
    }
  }
  return null;
}

// Get all devices from the hierarchy
function getAllDevices(nodes = locationData) {
  let devices = [];
  for (const node of nodes) {
    if (node.devices) {
      devices = devices.concat(node.devices);
    }
    if (node.children) {
      devices = devices.concat(getAllDevices(node.children));
    }
  }
  return devices;
}

// Export for use
window.DeviceData = {
  locations: locationData,
  schoolProfile: SCHOOL_PROFILE,
  findRoomById,
  getBreadcrumb,
  getAllDevices
};
