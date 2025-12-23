/**
 * Re-seed Montreal Trip Planner with TripPlannerMapNode
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

  // Montreal places with coordinates
  const montrealPlaces = [
    { id: 'place-1', name: 'Old Montreal', formattedAddress: 'Vieux-Montréal, Montreal, QC', lat: 45.5048, lng: -73.5572, category: 'attraction', distanceFromBase: { text: '0.3 km', duration: '4 min', meters: 300 }, assignedDay: 1 },
    { id: 'place-2', name: 'Notre-Dame Basilica', formattedAddress: '110 Rue Notre-Dame O, Montréal', lat: 45.5046, lng: -73.5560, category: 'attraction', distanceFromBase: { text: '0.4 km', duration: '5 min', meters: 400 }, assignedDay: 1 },
    { id: 'place-3', name: 'Mount Royal', formattedAddress: 'Parc du Mont-Royal, Montréal', lat: 45.5048, lng: -73.5877, category: 'activity', distanceFromBase: { text: '2.5 km', duration: '32 min', meters: 2500 }, assignedDay: 2 },
    { id: 'place-4', name: "Schwartz's Deli", formattedAddress: '3895 St Laurent Blvd, Montréal', lat: 45.5168, lng: -73.5792, category: 'restaurant', distanceFromBase: { text: '1.8 km', duration: '23 min', meters: 1800 }, assignedDay: 1 },
    { id: 'place-5', name: 'Jean-Talon Market', formattedAddress: '7070 Henri Julien Ave, Montréal', lat: 45.5369, lng: -73.6147, category: 'shopping', distanceFromBase: { text: '5.2 km', duration: '65 min', meters: 5200 }, assignedDay: 2 },
    { id: 'place-6', name: 'Mile End', formattedAddress: 'Mile End, Montréal', lat: 45.5256, lng: -73.5969, category: 'activity', distanceFromBase: { text: '3.5 km', duration: '44 min', meters: 3500 }, assignedDay: 2 },
    { id: 'place-7', name: 'Biodome', formattedAddress: '4777 Pierre-De Coubertin Ave, Montréal', lat: 45.5612, lng: -73.5466, category: 'attraction', distanceFromBase: { text: '6.5 km', duration: '20 min transit', meters: 6500 }, assignedDay: 3 },
    { id: 'place-8', name: 'Fine Arts Museum', formattedAddress: '1380 Sherbrooke St W, Montréal', lat: 45.4986, lng: -73.5793, category: 'attraction', distanceFromBase: { text: '1.2 km', duration: '15 min', meters: 1200 }, assignedDay: 1 }
  ];

  const tripPlannerNode = {
    id: 'tripplanner-montreal-1',
    type: 'tripPlannerMapNode',
    position: { x: 950, y: 430 },
    data: {
      title: 'Montreal Trip Planner',
      apiKey: googlePlacesKey,
      baseLocation: {
        name: 'Hotel Le St-James (Old Montreal)',
        lat: 45.5035,
        lng: -73.5563,
        formattedAddress: '355 Rue Saint-Jacques, Montréal, QC H2Y 1N9'
      },
      places: montrealPlaces,
      proximityGroups: [
        { groupId: 1, suggestedDay: 'Day 1', places: ['Old Montreal', 'Notre-Dame Basilica', 'Fine Arts Museum', "Schwartz's Deli"], count: 4 },
        { groupId: 2, suggestedDay: 'Day 2', places: ['Mile End', 'Jean-Talon Market', 'Mount Royal'], count: 3 },
        { groupId: 3, suggestedDay: 'Day 3', places: ['Biodome'], count: 1 }
      ],
      aiSuggestion: "Based on proximity: Day 1 - Old Montreal area. Day 2 - Mile End + Mount Royal. Day 3 - Biodome."
    }
  };

  // Filter out old map nodes and add new one
  const filtered = nodes.filter(n => n.type !== 'mapNode' && n.type !== 'tripPlannerMapNode');
  filtered.push(tripPlannerNode);
  console.log('New nodes:', filtered.length);

  // Update document via PATCH
  const updateMask = 'updateMask.fieldPaths=nodes';
  const patchRes = await request(
    'PATCH',
    `/capsules/${CAPSULE_ID}?${updateMask}`,
    {
      fields: {
        nodes: toFirestoreValue(filtered)
      }
    }
  );

  if (patchRes.status === 200) {
    console.log('');
    console.log('✅ SUCCESS: Capsule updated with TripPlannerMapNode');
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
