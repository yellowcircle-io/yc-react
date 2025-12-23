/**
 * Re-seed Montreal Trip Planner - December 30, 2025 to January 3, 2026
 * Updated itinerary with Boxotel hotel, 10 attractions, NYE dinner
 * Uses Firestore REST API directly
 */

const https = require('https');
const fs = require('fs');

// Get access token from Firebase CLI config
const configPath = process.env.HOME + '/.config/configstore/firebase-tools.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const accessToken = config.tokens.access_token;

const PROJECT_ID = 'yellowcircle-app';
const CAPSULE_ID = 'montreal-trip-dec2025';

// Helper to make HTTPS request
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Convert JS object to Firestore document format
function toFirestoreValue(value) {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { integerValue: String(value) };
    }
    return { doubleValue: value };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(value)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

// Convert Firestore document to JS object
function fromFirestoreValue(value) {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return parseInt(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) {
    return (value.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ('mapValue' in value) {
    const obj = {};
    for (const [k, v] of Object.entries(value.mapValue.fields || {})) {
      obj[k] = fromFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

async function reseed() {
  const googlePlacesKey = '***REMOVED***';

  console.log('Fetching capsule:', CAPSULE_ID);

  // Get current document
  const getRes = await request('GET', `/capsules/${CAPSULE_ID}`);

  if (getRes.status !== 200) {
    console.error('Failed to get capsule:', getRes.data);
    process.exit(1);
  }

  const doc = getRes.data;
  const fields = doc.fields || {};

  // Parse existing nodes
  const nodes = fromFirestoreValue(fields.nodes || { arrayValue: { values: [] } });
  console.log('Current nodes:', nodes.length);

  // ===========================================
  // NEW TRIP DATA - December 30, 2025 to January 3, 2026
  // ===========================================

  // New Hotel: Boxotel Montreal
  const baseLocation = {
    name: 'Boxotel Montreal',
    lat: 45.5153,
    lng: -73.5585,
    formattedAddress: '175 Rue Ontario Est, Montreal, QC, H2X1H5 Canada'
  };

  // 10 Places to Visit (with walking distances from Boxotel)
  // Distances calculated using Haversine formula from hotel coordinates
  const montrealPlaces = [
    // Old Montreal Area (Day 2 - Jan 1)
    {
      id: 'place-1',
      name: 'Walk Old Montreal',
      formattedAddress: 'Vieux-Montreal, Montreal, QC',
      lat: 45.5048,
      lng: -73.5572,
      category: 'attraction',
      distanceFromBase: { text: '1.2 km', duration: '15 min', meters: 1200 },
      assignedDay: 2
    },
    {
      id: 'place-2',
      name: 'Notre-Dame Cathedral',
      formattedAddress: '110 Rue Notre-Dame O, Montreal',
      lat: 45.5046,
      lng: -73.5560,
      category: 'attraction',
      distanceFromBase: { text: '1.2 km', duration: '15 min', meters: 1200 },
      assignedDay: 2
    },
    {
      id: 'place-3',
      name: 'Old Port',
      formattedAddress: 'Old Port of Montreal, Montreal, QC',
      lat: 45.5075,
      lng: -73.5533,
      category: 'attraction',
      distanceFromBase: { text: '1.0 km', duration: '12 min', meters: 1000 },
      assignedDay: 2
    },
    {
      id: 'place-4',
      name: 'La Grande Roue de Montreal',
      formattedAddress: '362 Rue de la Commune E, Montreal',
      lat: 45.5047,
      lng: -73.5514,
      category: 'activity',
      distanceFromBase: { text: '1.3 km', duration: '16 min', meters: 1300 },
      assignedDay: 2
    },
    // Downtown Area (Day 1 - Dec 31 NYE)
    {
      id: 'place-5',
      name: 'Montreal Underground City',
      formattedAddress: 'RESO Underground City, Montreal, QC',
      lat: 45.5017,
      lng: -73.5673,
      category: 'shopping',
      distanceFromBase: { text: '1.7 km', duration: '22 min', meters: 1700 },
      assignedDay: 1
    },
    {
      id: 'place-6',
      name: 'Saint Catherine Street',
      formattedAddress: 'Rue Sainte-Catherine, Montreal, QC',
      lat: 45.5088,
      lng: -73.5700,
      category: 'shopping',
      distanceFromBase: { text: '1.2 km', duration: '15 min', meters: 1200 },
      assignedDay: 1
    },
    {
      id: 'place-7',
      name: 'Christ Church Cathedral',
      formattedAddress: '635 Rue Sainte-Catherine O, Montreal',
      lat: 45.5033,
      lng: -73.5713,
      category: 'attraction',
      distanceFromBase: { text: '1.7 km', duration: '21 min', meters: 1700 },
      assignedDay: 1
    },
    {
      id: 'place-8',
      name: 'MAC Museum of Contemporary Art',
      formattedAddress: '185 Rue Sainte-Catherine O, Montreal',
      lat: 45.5079,
      lng: -73.5663,
      category: 'attraction',
      distanceFromBase: { text: '1.3 km', duration: '16 min', meters: 1300 },
      assignedDay: 1
    },
    // Far Locations (Day 3 - Jan 2)
    {
      id: 'place-9',
      name: 'Our Lady of La Difesa',
      formattedAddress: '6800 Avenue Henri-Julien, Montreal',
      lat: 45.5431,
      lng: -73.5996,
      category: 'attraction',
      distanceFromBase: { text: '4.5 km', duration: '55 min / Metro', meters: 4500 },
      assignedDay: 3
    },
    {
      id: 'place-10',
      name: "Saint Joseph's Oratory",
      formattedAddress: '3800 Chemin Queen Mary, Montreal',
      lat: 45.4920,
      lng: -73.6173,
      category: 'attraction',
      distanceFromBase: { text: '5.5 km', duration: 'Metro + walk', meters: 5500 },
      assignedDay: 3
    }
  ];

  // NYE Dinner - Special Event
  const nyeDinner = {
    id: 'dinner-nye',
    name: 'Le 9e - NYE Dinner (6pm)',
    formattedAddress: '1500 Blvd Robert-Bourassa, Montreal, QC H3A 3S6',
    lat: 45.5017,
    lng: -73.5673,
    category: 'restaurant',
    distanceFromBase: { text: '1.7 km', duration: '22 min', meters: 1700 },
    assignedDay: 1,
    isSpecialEvent: true,
    eventTime: '6:00 PM',
    eventDate: 'December 31, 2025'
  };

  // Add NYE dinner to places
  const allPlaces = [...montrealPlaces, nyeDinner];

  // Proximity Groups based on geography and time constraints
  const proximityGroups = [
    {
      groupId: 1,
      suggestedDay: 'Dec 31 (NYE)',
      places: ['Montreal Underground City', 'Saint Catherine Street', 'Christ Church Cathedral', 'MAC Museum of Contemporary Art', 'Le 9e - NYE Dinner (6pm)'],
      count: 5,
      notes: 'Downtown area + NYE dinner at 6pm'
    },
    {
      groupId: 2,
      suggestedDay: 'Jan 1',
      places: ['Walk Old Montreal', 'Notre-Dame Cathedral', 'Old Port', 'La Grande Roue de Montreal'],
      count: 4,
      notes: 'All in Old Montreal/Old Port area - walkable circuit'
    },
    {
      groupId: 3,
      suggestedDay: 'Jan 2',
      places: ["Saint Joseph's Oratory", 'Our Lady of La Difesa'],
      count: 2,
      notes: 'Requires Metro - both are religious/historic sites'
    }
  ];

  // Travel Information
  const travelInfo = {
    outbound: {
      carrier: 'Amtrak',
      train: 'Adirondack 69',
      route: 'NYC to Montreal',
      departure: 'Dec 30, 2025 - 7:15 AM',
      arrival: 'Dec 30, 2025 - 8:15 PM',
      duration: '13 hours'
    },
    return: {
      carrier: 'Amtrak',
      train: 'Adirondack 69',
      route: 'Montreal to NYC',
      departure: 'Jan 3, 2026 - 11:10 AM',
      arrival: 'Jan 3, 2026 - 10:15 PM',
      duration: '11 hours'
    }
  };

  // AI Suggestion with detailed itinerary
  const aiSuggestion = `Montreal Trip: Dec 30, 2025 - Jan 3, 2026

ARRIVAL (Dec 30): Train arrives 8:15pm. Check into Boxotel, light evening walk around Quartier Latin.

DAY 1 - NYE (Dec 31): Downtown exploration
- Morning: Underground City (RESO) - warm indoor shopping/exploring
- Midday: Saint Catherine Street, Christ Church Cathedral
- Afternoon: MAC Museum of Contemporary Art
- Evening: NYE Dinner at Le 9e (6pm reservation)

DAY 2 (Jan 1): Old Montreal Circuit
- Walk Old Montreal cobblestone streets
- Notre-Dame Cathedral (stunning interior)
- Old Port waterfront
- La Grande Roue (Ferris wheel - great views!)
All walkable from each other (15-20 min circuit)

DAY 3 (Jan 2): Religious/Historic Sites
- Morning: Saint Joseph's Oratory (Metro to Cote-des-Neiges)
- Afternoon: Our Lady of La Difesa (Little Italy area)
Both require Metro but are Montreal must-sees

DEPARTURE (Jan 3): Train departs 11:10am. Light morning near hotel before heading to Gare Centrale.`;

  const tripPlannerNode = {
    id: 'tripplanner-montreal-1',
    type: 'tripPlannerMapNode',
    position: { x: 950, y: 430 },
    data: {
      title: 'Montreal Dec 30 - Jan 3',
      apiKey: googlePlacesKey,
      baseLocation: baseLocation,
      places: allPlaces,
      proximityGroups: proximityGroups,
      aiSuggestion: aiSuggestion,
      travelInfo: travelInfo,
      tripDates: {
        start: '2025-12-30',
        end: '2026-01-03',
        nights: 4
      }
    }
  };

  // Filter out old map nodes and add new one
  const filtered = nodes.filter(n => n.type !== 'mapNode' && n.type !== 'tripPlannerMapNode');
  filtered.push(tripPlannerNode);
  console.log('New nodes:', filtered.length);

  // Also update capsule title
  const updateMask = 'updateMask.fieldPaths=nodes&updateMask.fieldPaths=title';
  const patchRes = await request(
    'PATCH',
    `/capsules/${CAPSULE_ID}?${updateMask}`,
    {
      fields: {
        nodes: toFirestoreValue(filtered),
        title: toFirestoreValue('Montreal Trip - Dec 30 to Jan 3')
      }
    }
  );

  if (patchRes.status === 200) {
    console.log('');
    console.log('SUCCESS: Capsule updated with new Montreal itinerary');
    console.log('');
    console.log('Trip Dates: December 30, 2025 - January 3, 2026');
    console.log('Hotel: Boxotel Montreal');
    console.log('Places: 10 attractions + NYE dinner');
    console.log('');
    console.log('View at: https://yellowcircle.io/unity-notes/view/montreal-trip-dec2025');
  } else {
    console.error('Update failed:', patchRes.status, patchRes.data);
    process.exit(1);
  }
}

reseed().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
