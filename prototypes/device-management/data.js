// Device Management Platform - Mock Data Generator
// Generates hierarchical location data with devices

// Device definitions - each room has these exact devices
const ROOM_DEVICES = [
  { model: 'Touchlink Panel', type: 'managed', prefix: 'TLP' },
  { model: 'Controller', type: 'managed', prefix: 'CTL' },
  { model: 'Matrix Switcher', type: 'managed', prefix: 'MTX' },
  { model: 'Touchlink Scheduler', type: 'discovered', prefix: 'TLS' }
];

const ALERT_TYPES = [
  { severity: 'critical', message: 'High CPU utilization (>95%)' },
  { severity: 'critical', message: 'Memory exhaustion imminent' },
  { severity: 'critical', message: 'Power supply failure' },
  { severity: 'critical', message: 'Fan failure detected' },
  { severity: 'warning', message: 'Interface errors detected' },
  { severity: 'warning', message: 'High temperature warning' },
  { severity: 'warning', message: 'Certificate expiring soon' },
  { severity: 'warning', message: 'Firmware update available' },
  { severity: 'warning', message: 'Port flapping detected' }
];

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

function generateHostname(prefix, building, floor, room) {
  return `${prefix}-${building.toLowerCase().replace(' ', '')}-f${floor}-r${room}`;
}

function generateIP(baseOctet, deviceIndex) {
  return `10.${baseOctet}.${Math.floor(deviceIndex / 254)}.${(deviceIndex % 254) + 1}`;
}

// Generate device data - creates exactly 4 devices per room (3 managed, 1 discovered)
function generateDevices(countryName, cityName, buildingName, floorName, roomName, roomIndex, ipBase) {
  const devices = [];
  const floorNum = floorName.replace('Floor ', '');
  const roomNum = roomName.replace('Room ', '');

  ROOM_DEVICES.forEach((deviceDef, i) => {
    const deviceIndex = roomIndex * ROOM_DEVICES.length + i;
    const isManaged = deviceDef.type === 'managed';

    // For managed devices: 85% online, 15% offline
    const isOnline = isManaged ? Math.random() > 0.15 : null;

    // Generate alerts for ~25% of managed devices (discovered never have alerts)
    const alerts = [];
    if (isManaged && Math.random() < 0.25) {
      const numAlerts = Math.floor(Math.random() * 2) + 1;
      const usedAlerts = new Set();
      for (let a = 0; a < numAlerts; a++) {
        let alertIndex;
        do {
          alertIndex = Math.floor(Math.random() * ALERT_TYPES.length);
        } while (usedAlerts.has(alertIndex));
        usedAlerts.add(alertIndex);
        alerts.push({
          id: `alert-${deviceIndex}-${a}`,
          ...ALERT_TYPES[alertIndex],
          timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
        });
      }
    }

    // Force some issues in certain rooms to ensure red statuses
    const forceIssue = roomIndex % 5 === 0 && i === 0;

    devices.push({
      id: `device-${deviceIndex}`,
      hostname: generateHostname(deviceDef.prefix, buildingName, floorNum, roomNum),
      model: deviceDef.model,
      serialNumber: generateSerialNumber(),
      macAddress: generateMAC(),
      ipAddress: generateIP(ipBase, i),
      type: deviceDef.type,
      status: isManaged ? (forceIssue ? 'offline' : (isOnline ? 'online' : 'offline')) : null,
      alerts: forceIssue && alerts.length === 0 && isManaged ? [{
        id: `alert-${deviceIndex}-forced`,
        severity: 'critical',
        message: 'Device unreachable',
        timestamp: new Date().toISOString()
      }] : alerts,
      lastSeen: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      firmware: `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}`,
      location: {
        country: countryName,
        city: cityName,
        building: buildingName,
        floor: floorName,
        room: roomName
      }
    });
  });

  return devices;
}

// Calculate status based on devices
function calculateStatus(devices) {
  if (!devices || devices.length === 0) return 'healthy';

  const hasIssue = devices.some(d => {
    if (d.type === 'managed') {
      return d.status === 'offline' || (d.alerts && d.alerts.length > 0);
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

// Count devices in subtree
function countDevices(node) {
  if (node.devices) {
    return {
      total: node.devices.length,
      managed: node.devices.filter(d => d.type === 'managed').length,
      discovered: node.devices.filter(d => d.type === 'discovered').length
    };
  }

  if (node.children) {
    return node.children.reduce((acc, child) => {
      const childCount = countDevices(child);
      return {
        total: acc.total + childCount.total,
        managed: acc.managed + childCount.managed,
        discovered: acc.discovered + childCount.discovered
      };
    }, { total: 0, managed: 0, discovered: 0 });
  }

  return { total: 0, managed: 0, discovered: 0 };
}

// Generate the full hierarchy
function generateLocationHierarchy() {
  const countries = [
    { name: 'USA', cities: ['Raleigh', 'Anaheim'] }
  ];

  let roomIndex = 0;
  let ipBase = 10;

  const hierarchy = countries.map(country => {
    const countryNode = {
      id: `country-${country.name.toLowerCase()}`,
      name: country.name,
      type: 'country',
      expanded: true,
      children: country.cities.map(cityName => {
        const cityNode = {
          id: `city-${cityName.toLowerCase()}`,
          name: cityName,
          type: 'city',
          expanded: false,
          children: ['Building 1', 'Building 2'].map(buildingName => {
            const buildingNode = {
              id: `building-${cityName.toLowerCase()}-${buildingName.toLowerCase().replace(' ', '')}`,
              name: buildingName,
              type: 'building',
              expanded: false,
              children: ['Floor 1', 'Floor 2'].map(floorName => {
                const floorNode = {
                  id: `floor-${cityName.toLowerCase()}-${buildingName.toLowerCase().replace(' ', '')}-${floorName.toLowerCase().replace(' ', '')}`,
                  name: floorName,
                  type: 'floor',
                  expanded: false,
                  children: ['Room 101', 'Room 102', 'Room 103', 'Room 104', 'Room 105', 'Room 106'].map(roomName => {
                    const devices = generateDevices(
                      country.name,
                      cityName,
                      buildingName,
                      floorName,
                      roomName,
                      roomIndex++,
                      ipBase++
                    );

                    return {
                      id: `room-${cityName.toLowerCase()}-${buildingName.toLowerCase().replace(' ', '')}-${floorName.toLowerCase().replace(' ', '')}-${roomName.toLowerCase().replace(' ', '')}`,
                      name: roomName,
                      type: 'room',
                      devices: devices,
                      status: calculateStatus(devices),
                      deviceCount: countDevices({ devices })
                    };
                  })
                };

                // Calculate floor status and device count
                floorNode.status = aggregateStatus(floorNode.children);
                floorNode.deviceCount = countDevices(floorNode);

                return floorNode;
              })
            };

            // Calculate building status and device count
            buildingNode.status = aggregateStatus(buildingNode.children);
            buildingNode.deviceCount = countDevices(buildingNode);

            return buildingNode;
          })
        };

        // Calculate city status and device count
        cityNode.status = aggregateStatus(cityNode.children);
        cityNode.deviceCount = countDevices(cityNode);

        return cityNode;
      })
    };

    // Calculate country status and device count
    countryNode.status = aggregateStatus(countryNode.children);
    countryNode.deviceCount = countDevices(countryNode);

    return countryNode;
  });

  return hierarchy;
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
  findRoomById,
  getBreadcrumb,
  getAllDevices
};
