const CIVIC_ADDRESS_QUERY_URL =
  'https://services2.arcgis.com/11XBiaBYA9Ep0yNJ/arcgis/rest/services/CivicAddresses/FeatureServer/0/query';
const SOLID_WASTE_QUERY_URL =
  'https://services2.arcgis.com/11XBiaBYA9Ep0yNJ/arcgis/rest/services/SolidWasteCollectionAreas/FeatureServer/0/query';
const CITYWORKS_REQUESTS_QUERY_URL =
  'https://services2.arcgis.com/11XBiaBYA9Ep0yNJ/arcgis/rest/services/Cityworks_Service_Requests/FeatureServer/0/query';

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

const WEEKDAY_INDEX = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DEFAULT_ISSUE_LOOKBACK_DAYS = 30;

const HOMEOWNER_ALERT_CATEGORY_ALLOWLIST = new Set([
  'PARKING',
  'ROWMAINTENANCE',
  'ROWSERVICES',
  'SOLIDWASTE',
  'TRAFFICMAINTENANCE',
  'TRAFFICSERVICES',
  'COMMUNITYSAFETY',
]);

const HOMEOWNER_ALERT_DESCRIPTION_ALLOWLIST = new Set([
  'ILLEGALLY PARKED VEHICLE',
  'OBSTRUCTIONS',
  'STREET SIGN MISSING OR DAMAGED',
  'TRAFFIC SIGNALS',
  'PAVEMENT MARKINGS',
  'STREET SURFACE MAINTENANCE',
  'WALKING SURFACE MAINTENANCE',
  'DRAINAGE INFRASTRUCTURE MAINTENANCE OR REPAIR',
  'DRAINAGE INFRASTRUCTURE REQUEST',
  'FLOODING REQUESTS',
  'WINTER FLOODING',
  'SNOW OPERATIONS - URGENT',
  'SNOW OPERATIONS - NON-URGENT',
  'SNOW DAMAGE',
  'CURBSIDE SOLID WASTE',
  'GRAFFITI',
  'ROW LIGHTS',
  'ELECTRICAL INCIDENT OR REQUEST',
  'UTILITY RELATED STREET CUTS AND TRENCHES',
  'DECEASED ANIMALS',
]);

const HOMEOWNER_ALERT_DESCRIPTION_KEYWORDS = [
  'FLOOD',
  'DRAINAGE',
  'SIDEWALK',
  'ROAD',
  'STREET',
  'SNOW',
  'PARKING',
  'TRAFFIC',
  'SIGN',
  'LIGHT',
  'GRAFFITI',
  'LITTER',
  'WASTE',
  'OBSTRUCTION',
];

const LOW_SIGNAL_DESCRIPTION_KEYWORDS = [
  'INQUIR',
  'MARKETING',
  'POLIC',
  'PLANNING',
  'SCHEDULING',
  'MAIL OUT',
  'DESIGN',
  'COMMENT',
];

const FRIENDLY_ALERT_TITLE_BY_DESCRIPTION = new Map([
  ['ILLEGALLY PARKED VEHICLE', 'Illegal parking'],
  ['OBSTRUCTIONS', 'Road obstruction'],
  ['STREET SIGN MISSING OR DAMAGED', 'Street sign issue'],
  ['TRAFFIC SIGNALS', 'Traffic signal issue'],
  ['PAVEMENT MARKINGS', 'Road markings issue'],
  ['STREET SURFACE MAINTENANCE', 'Road surface issue'],
  ['WALKING SURFACE MAINTENANCE', 'Sidewalk issue'],
  ['DRAINAGE INFRASTRUCTURE MAINTENANCE OR REPAIR', 'Drainage issue'],
  ['DRAINAGE INFRASTRUCTURE REQUEST', 'Drainage issue'],
  ['FLOODING REQUESTS', 'Flooding risk'],
  ['WINTER FLOODING', 'Winter flooding risk'],
  ['SNOW OPERATIONS - URGENT', 'Urgent snow clearing issue'],
  ['SNOW OPERATIONS - NON-URGENT', 'Snow clearing issue'],
  ['SNOW DAMAGE', 'Snow damage report'],
  ['CURBSIDE SOLID WASTE', 'Curbside waste issue'],
  ['GRAFFITI', 'Graffiti report'],
  ['ROW LIGHTS', 'Street light issue'],
  ['ELECTRICAL INCIDENT OR REQUEST', 'Street light issue'],
  ['UTILITY RELATED STREET CUTS AND TRENCHES', 'Utility trench issue'],
  ['DECEASED ANIMALS', 'Deceased animal pickup'],
]);

const IMMEDIATE_ALERT_CATEGORIES = new Set([
  'PARKING',
  'TRAFFICMAINTENANCE',
  'TRAFFICSERVICES',
  'COMMUNITYSAFETY',
]);

const IMMEDIATE_ALERT_DESCRIPTION_KEYWORDS = [
  'SNOW',
  'OBSTRUCTION',
  'FLOOD',
  'DRAINAGE',
  'TRAFFIC SIGNAL',
  'ILLEGALLY PARKED',
  'PAVEMENT',
  'STREET SURFACE',
  'WALKING SURFACE',
  'STREET CUT',
  'TRENCH',
];

const STREET_TYPES = new Set([
  'ALY',
  'AVE',
  'BLVD',
  'BYP',
  'CIR',
  'CRT',
  'CRES',
  'DR',
  'EXT',
  'GDNS',
  'GREEN',
  'HWY',
  'HTS',
  'HILL',
  'LANE',
  'LN',
  'LOOP',
  'PASS',
  'PATH',
  'PK',
  'PKWY',
  'PL',
  'PLACE',
  'PT',
  'RD',
  'RISE',
  'ROW',
  'RUN',
  'SQ',
  'ST',
  'TERR',
  'TRAIL',
  'WAY',
]);

// Google Places returns full street type words. Map them to the ArcGIS abbreviations
// used in the CivicAddresses dataset so the STR_TYPE filter works in attempts 1 & 2.
const STREET_TYPE_ALIASES = new Map([
  ['ALLEY', 'ALY'],
  ['AVENUE', 'AVE'],
  ['BOULEVARD', 'BLVD'],
  ['BYPASS', 'BYP'],
  ['CIRCLE', 'CIR'],
  ['COURT', 'CRT'],
  ['CRESCENT', 'CRES'],
  ['DRIVE', 'DR'],
  ['EXTENSION', 'EXT'],
  ['GARDENS', 'GDNS'],
  ['HIGHWAY', 'HWY'],
  ['PARKWAY', 'PKY'],
  ['ROAD', 'RD'],
  ['SQUARE', 'SQ'],
  ['STREET', 'ST'],
  ['TERRACE', 'TERR'],
  ['TRAIL', 'TRL'],
]);

function buildQueryString(params) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

async function fetchArcGisJson(url, params) {
  const response = await fetch(`${url}?${buildQueryString(params)}`);

  if (!response.ok) {
    throw new Error(`Halifax Open Data request failed with status ${response.status}.`);
  }

  const payload = await response.json();

  if (payload?.error?.message) {
    throw new Error(payload.error.message);
  }

  return payload;
}

const ARC_GIS_WHERE_TEXT = /^[A-Z0-9 ]+$/;

function normalizeUpper(value) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toArcGisWhereNumber(value) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('Invalid civic number for ArcGIS where clause.');
  }

  return String(value);
}

function toArcGisWhereText(value, fieldName) {
  const normalized = normalizeUpper(value);

  if (!normalized) {
    throw new Error(`Invalid ${fieldName} for ArcGIS where clause.`);
  }

  if (!ARC_GIS_WHERE_TEXT.test(normalized)) {
    throw new Error(`Unsafe ${fieldName} for ArcGIS where clause.`);
  }

  return normalized;
}

function parseAddressInput(address) {
  const [streetLineRaw = '', communityLineRaw = ''] = address.split(',');
  const streetLine = normalizeUpper(streetLineRaw)
    .replace(/\b(APT|APARTMENT|UNIT|SUITE|STE)\s+[A-Z0-9-]+\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const community = normalizeUpper(communityLineRaw);
  const civicMatch = streetLine.match(/\d+/);

  if (!civicMatch) {
    return null;
  }

  const civicNumber = Number(civicMatch[0]);
  const streetPortion = streetLine.slice(civicMatch.index + civicMatch[0].length).trim();
  const tokens = streetPortion.split(' ').filter(Boolean);

  if (!tokens.length) {
    return null;
  }

  let streetType = null;
  const lastToken = tokens[tokens.length - 1];

  if (STREET_TYPES.has(lastToken)) {
    streetType = lastToken;
    tokens.pop();
  } else if (STREET_TYPE_ALIASES.has(lastToken)) {
    streetType = STREET_TYPE_ALIASES.get(lastToken);
    tokens.pop();
  }

  const streetName = tokens.join(' ').trim();

  if (!streetName) {
    return null;
  }

  return {
    civicNumber,
    streetName,
    streetType,
    community,
  };
}

function createAddressWhereClause({ civicNumber, streetName, streetType, community }) {
  const conditions = [
    `CIV_NUM = ${toArcGisWhereNumber(civicNumber)}`,
    `UPPER(STR_NAME) LIKE '${toArcGisWhereText(streetName, 'street name')}%'`,
  ];

  if (streetType) {
    conditions.push(`UPPER(STR_TYPE) = '${toArcGisWhereText(streetType, 'street type')}'`);
  }

  if (community) {
    conditions.push(`UPPER(GSA_NAME) LIKE '${toArcGisWhereText(community, 'community')}%'`);
  }

  return conditions.join(' AND ');
}

function formatCanonicalAddress(attributes) {
  const streetParts = [
    attributes.FULL_CIVIC,
    attributes.STR_NAME,
    attributes.STR_TYPE,
  ].filter(Boolean);
  const localityParts = [attributes.GSA_NAME, attributes.CIV_POSTAL].filter(Boolean);

  return [streetParts.join(' '), localityParts.join(', ')].filter(Boolean).join(', ');
}

async function resolveAddressCandidate(where) {
  const payload = await fetchArcGisJson(CIVIC_ADDRESS_QUERY_URL, {
    where,
    outFields: 'FULL_CIVIC,STR_NAME,STR_TYPE,GSA_NAME,CIV_POSTAL',
    orderByFields: 'OBJECTID',
    resultRecordCount: 1,
    returnGeometry: true,
    outSR: 4326,
    f: 'json',
  });

  return payload.features?.[0] ?? null;
}

export async function resolveHalifaxAddress(address) {
  const parsedAddress = parseAddressInput(address);

  if (!parsedAddress) {
    throw new Error('Enter a Halifax civic address like 123 Spring Garden Rd, Halifax.');
  }

  const attempts = [
    createAddressWhereClause(parsedAddress),
    createAddressWhereClause({ ...parsedAddress, community: '' }),
    createAddressWhereClause({ ...parsedAddress, streetType: null, community: '' }),
  ];

  for (const where of attempts) {
    const feature = await resolveAddressCandidate(where);

    if (feature?.geometry) {
      const { attributes, geometry } = feature;

      return {
        canonicalAddress: formatCanonicalAddress(attributes),
        community: attributes.GSA_NAME || '',
        postalCode: attributes.CIV_POSTAL || '',
        latitude: geometry.y,
        longitude: geometry.x,
      };
    }
  }

  throw new Error('We could not match that address in Halifax Open Data.');
}

function getNextCollectionDate(dayName) {
  const weekday = WEEKDAY_INDEX[dayName];

  if (weekday === undefined) {
    return null;
  }

  const now = new Date();
  const next = new Date(now);
  const dayOffset = (weekday - now.getDay() + 7) % 7;
  next.setDate(now.getDate() + dayOffset);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDateLabel(date) {
  return `${WEEKDAY_SHORT[date.getDay()]}, ${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
}

function formatLongDateLabel(date) {
  return `${WEEKDAY_LONG[date.getDay()]}, ${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
}

function getRecycleZoneParity(recycleFrequency) {
  const match = recycleFrequency?.match(/zone\s+([ab])/i);

  if (!match) {
    return null;
  }

  return match[1].toUpperCase() === 'A' ? 0 : 1;
}

function getWeekParity(anchorDate, targetDate) {
  const anchor = new Date(anchorDate);
  anchor.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const weekDiff = Math.floor((target.getTime() - anchor.getTime()) / WEEK_IN_MS);
  return Math.abs(weekDiff % 2);
}

function inferCollectionItemsForDate(wasteAttributes, date) {
  const zoneParity = getRecycleZoneParity(wasteAttributes.RECYCLEFRQ);

  if (!wasteAttributes.SDATE || zoneParity === null) {
    return wasteAttributes.COLLECT ? [toTitleCase(wasteAttributes.COLLECT)] : [];
  }

  const weekParity = getWeekParity(wasteAttributes.SDATE, date);
  const isRecyclingWeek = weekParity === zoneParity;

  return isRecyclingWeek ? ['Organics', 'Recycling'] : ['Organics', 'Garbage'];
}

function buildUpcomingSchedule(wasteAttributes) {
  const nextDate = getNextCollectionDate(wasteAttributes.COLLECT);

  if (!nextDate) {
    return [];
  }

  return Array.from({ length: 4 }, (_, index) => {
    const date = new Date(nextDate);
    date.setDate(nextDate.getDate() + index * 7);
    const inferredItems = inferCollectionItemsForDate(wasteAttributes, date);

    return {
      id: `${wasteAttributes.COLL_AREA || 'area'}-${index}`,
      day: formatDateLabel(date),
      dateISO: date.toISOString().slice(0, 10),
      items: inferredItems.join(' • '),
    };
  });
}

export async function fetchWasteCollectionSchedule({ latitude, longitude }) {
  const payload = await fetchArcGisJson(SOLID_WASTE_QUERY_URL, {
    geometry: `${longitude},${latitude}`,
    geometryType: 'esriGeometryPoint',
    inSR: 4326,
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'COLLECT,COLL_AREA,RECYCLEFRQ,COLL_SCHED,CONTRACTOR,SDATE',
    returnGeometry: false,
    f: 'json',
  });

  const attributes = payload.features?.[0]?.attributes;

  if (!attributes) {
    throw new Error('No waste collection area was found for this address.');
  }

  const nextDate = getNextCollectionDate(attributes.COLLECT);
  const scheduleArea = attributes.COLL_SCHED || attributes.COLL_AREA || 'Schedule unavailable';
  const areaLabel = [attributes.COLL_AREA, attributes.CONTRACTOR].filter(Boolean).join(' • ');
  const nextCollectionItems = nextDate ? inferCollectionItemsForDate(attributes, nextDate) : [];

  return {
    nextCollection: {
      zone: scheduleArea,
      dateLabel: nextDate ? formatLongDateLabel(nextDate) : 'Collection day unavailable',
      area: areaLabel || 'Halifax solid waste service area',
      items: nextCollectionItems,
    },
    upcomingServices: buildUpcomingSchedule(attributes),
  };
}

function toCategoryType(record) {
  const subject = `${record.REQUEST_CATEGORY || ''} ${record.DESCRIPTION || ''}`.toLowerCase();

  if (
    subject.includes('parking') ||
    subject.includes('traffic') ||
    subject.includes('snow') ||
    subject.includes('road')
  ) {
    return 'traffic';
  }

  if (
    subject.includes('construction') ||
    subject.includes('maintenance') ||
    subject.includes('repair') ||
    subject.includes('mechanical')
  ) {
    return 'construction';
  }

  return 'info';
}

function toTitleCase(value) {
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatRelativeTime(dateValue) {
  const date = new Date(dateValue);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (Math.abs(diffHours) < 24) {
    if (diffHours <= 0) {
      return 'just now';
    }

    if (diffHours === 1) {
      return '1 hour ago';
    }

    return `${diffHours} hours ago`;
  }

  const diffDays = Math.round(diffHours / 24);

  if (diffDays <= 1) {
    return '1 day ago';
  }

  return `${diffDays} days ago`;
}

function formatExactDateTime(dateValue) {
  if (!dateValue) {
    return '';
  }

  const date = new Date(dateValue);

  return new Intl.DateTimeFormat('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatPriorityLabel(value) {
  if (!value) {
    return '';
  }

  return `Priority ${String(value).trim()}`;
}

function formatCategoryLabel(value) {
  if (!value) {
    return 'General';
  }

  const normalizedValue = String(value).trim().toUpperCase();

  if (normalizedValue === 'ROWSERVICES') {
    return 'Road Services';
  }

  return toTitleCase(normalizedValue.replace(/SERVICES/g, ' SERVICES'));
}

function formatDepartmentLabel(value) {
  if (!value) {
    return '';
  }

  const normalizedValue = String(value).trim().toUpperCase();

  if (normalizedValue === 'PW') {
    return 'Public Works';
  }

  return toTitleCase(normalizedValue);
}

function formatWorkOrderLabel(value) {
  if (!value) {
    return '';
  }

  return String(value).trim().toUpperCase() === 'Y' ? 'Work order created' : 'Awaiting work order';
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }

  return `${distanceKm.toFixed(1)} km away`;
}

function toArcGisUtcDateLiteral(daysBack) {
  const days = Math.max(1, Math.round(Number(daysBack) || DEFAULT_ISSUE_LOOKBACK_DAYS));
  const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const year = threshold.getUTCFullYear();
  const month = String(threshold.getUTCMonth() + 1).padStart(2, '0');
  const day = String(threshold.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isHomeownerRelevantIssue(attributes) {
  const category = String(attributes.REQUEST_CATEGORY || '').trim().toUpperCase();
  const description = String(attributes.DESCRIPTION || '').trim().toUpperCase();

  if (LOW_SIGNAL_DESCRIPTION_KEYWORDS.some((keyword) => description.includes(keyword))) {
    return false;
  }

  if (HOMEOWNER_ALERT_CATEGORY_ALLOWLIST.has(category)) {
    return true;
  }

  if (HOMEOWNER_ALERT_DESCRIPTION_ALLOWLIST.has(description)) {
    return true;
  }

  return HOMEOWNER_ALERT_DESCRIPTION_KEYWORDS.some((keyword) => description.includes(keyword));
}

function formatAlertTitle(value) {
  const normalized = String(value || '').trim().toUpperCase();

  if (!normalized) {
    return 'Cityworks request';
  }

  if (FRIENDLY_ALERT_TITLE_BY_DESCRIPTION.has(normalized)) {
    return FRIENDLY_ALERT_TITLE_BY_DESCRIPTION.get(normalized);
  }

  return toTitleCase(normalized);
}

function classifyAlertBucket(attributes) {
  const category = String(attributes.REQUEST_CATEGORY || '').trim().toUpperCase();
  const description = String(attributes.DESCRIPTION || '').trim().toUpperCase();

  if (IMMEDIATE_ALERT_CATEGORIES.has(category)) {
    return 'immediate';
  }

  if (IMMEDIATE_ALERT_DESCRIPTION_KEYWORDS.some((keyword) => description.includes(keyword))) {
    return 'immediate';
  }

  return 'neighbourhood';
}

export async function fetchNearbyCityworksIssues(
  { latitude, longitude },
  { radiusKm = 0.5, limit, maxIssueAgeDays = DEFAULT_ISSUE_LOOKBACK_DAYS } = {}
) {
  const latitudeDelta = radiusKm / 111;
  const longitudeDelta = radiusKm / Math.max(Math.cos((latitude * Math.PI) / 180) * 111, 0.1);
  const minLat = latitude - latitudeDelta;
  const maxLat = latitude + latitudeDelta;
  const minLon = longitude - longitudeDelta;
  const maxLon = longitude + longitudeDelta;
  const minInitiatedDate = toArcGisUtcDateLiteral(maxIssueAgeDays);
  const where = [
    "STATUS <> 'CLOSED'",
    `DATE_INITIATED >= DATE '${minInitiatedDate}'`,
    'LATITUDE IS NOT NULL',
    'LONGITUDE IS NOT NULL',
    `LATITUDE BETWEEN ${minLat} AND ${maxLat}`,
    `LONGITUDE BETWEEN ${minLon} AND ${maxLon}`,
  ].join(' AND ');

  const payload = await fetchArcGisJson(CITYWORKS_REQUESTS_QUERY_URL, {
    where,
    outFields:
      'REQUEST_ID,DESCRIPTION,REQUEST_CATEGORY,ADDRESS,COMMUNITY,DISTRICT,STATUS,PRIORITY,DEPT_RESPONSIBILITY,WORK_ORDER,DATE_INITIATED,DATE_CLOSED,LATITUDE,LONGITUDE,RESOLUTION',
    orderByFields: 'DATE_INITIATED DESC',
    resultRecordCount: 1000,
    f: 'json',
  });

  const sortedIssues = (payload.features || [])
    .map((feature) => feature.attributes || {})
    .filter((attributes) => isHomeownerRelevantIssue(attributes))
    .map((attributes) => {
      const distanceKm = haversineDistanceKm(
        latitude,
        longitude,
        attributes.LATITUDE,
        attributes.LONGITUDE
      );

      return {
        id: String(attributes.REQUEST_ID),
        type: toCategoryType(attributes),
        urgencyBucket: classifyAlertBucket(attributes),
        title: formatAlertTitle(attributes.DESCRIPTION),
        description: attributes.ADDRESS ? `Near ${attributes.ADDRESS}` : formatCategoryLabel(attributes.REQUEST_CATEGORY),
        meta: [
          formatRelativeTime(attributes.DATE_INITIATED),
          attributes.STATUS,
          formatDistance(distanceKm),
        ]
          .filter(Boolean)
          .join(' • '),
        status: attributes.STATUS || '',
        category: attributes.REQUEST_CATEGORY || '',
        categoryLabel: formatCategoryLabel(attributes.REQUEST_CATEGORY),
        statusLabel: toTitleCase(attributes.STATUS || 'Open'),
        address: attributes.ADDRESS || '',
        community: attributes.COMMUNITY || '',
        district: attributes.DISTRICT || '',
        priority: attributes.PRIORITY || '',
        priorityLabel: formatPriorityLabel(attributes.PRIORITY),
        department: formatDepartmentLabel(attributes.DEPT_RESPONSIBILITY),
        resolution: attributes.RESOLUTION || '',
        workOrder: attributes.WORK_ORDER || '',
        workOrderLabel: formatWorkOrderLabel(attributes.WORK_ORDER),
        initiatedAt: attributes.DATE_INITIATED || null,
        initiatedAtLabel: formatRelativeTime(attributes.DATE_INITIATED),
        exactInitiatedAt: formatExactDateTime(attributes.DATE_INITIATED),
        closedAt: attributes.DATE_CLOSED || null,
        exactClosedAt: formatExactDateTime(attributes.DATE_CLOSED),
        distanceKm,
        distanceLabel: formatDistance(distanceKm),
        latitude: attributes.LATITUDE,
        longitude: attributes.LONGITUDE,
      };
    })
    .filter((issue) => issue.distanceKm <= radiusKm)
    .sort((left, right) => left.distanceKm - right.distanceKm);

  if (Number.isFinite(limit) && limit > 0) {
    return sortedIssues.slice(0, limit);
  }

  return sortedIssues;
}

export async function loadHalifaxDashboardData(address, {
  issueRadiusKm = 0.5,
} = {}) {
  const resolvedAddress = await resolveHalifaxAddress(address);
  const [wasteSchedule, nearbyAlerts] = await Promise.all([
    fetchWasteCollectionSchedule(resolvedAddress),
    fetchNearbyCityworksIssues(resolvedAddress, {
      radiusKm: issueRadiusKm,
      maxIssueAgeDays: DEFAULT_ISSUE_LOOKBACK_DAYS,
    }),
  ]);

  return {
    resolvedAddress,
    nextCollection: wasteSchedule.nextCollection,
    upcomingServices: wasteSchedule.upcomingServices,
    nearbyAlerts,
  };
}
