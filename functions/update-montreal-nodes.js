/**
 * Update Montreal capsule placeholder nodes with actual itinerary
 */

const https = require('https');
const fs = require('fs');

const configPath = process.env.HOME + '/.config/configstore/firebase-tools.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const refreshToken = config.tokens.refresh_token;

const PROJECT_ID = 'yellowcircle-app';
const CAPSULE_ID = 'montreal-trip-dec2025';

// Helper to refresh access token
function getAccessToken() {
  return new Promise((resolve, reject) => {
    const postData = `client_id=563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com&client_secret=j9iVZfS8kkCEFUPaAeJV0sAi&refresh_token=${refreshToken}&grant_type=refresh_token`;

    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': postData.length }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const tokenData = JSON.parse(data);
        resolve(tokenData.access_token);
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Helper to make Firestore REST API request
function firestoreRequest(accessToken, method, path, body = null) {
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
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { integerValue: String(value) };
    return { doubleValue: value };
  }
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
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
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in value) {
    const obj = {};
    for (const [k, v] of Object.entries(value.mapValue.fields || {})) {
      obj[k] = fromFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

async function updateNodes() {
  const accessToken = await getAccessToken();
  console.log('Got access token');

  // Get current document
  const getRes = await firestoreRequest(accessToken, 'GET', `/capsules/${CAPSULE_ID}`);
  if (getRes.status !== 200) {
    console.error('Failed to get capsule:', getRes.data);
    process.exit(1);
  }

  const doc = getRes.data;
  const nodes = fromFirestoreValue(doc.fields?.nodes || { arrayValue: { values: [] } });
  console.log('Current nodes:', nodes.length);

  // Update nodes with actual Montreal itinerary
  const updatedNodes = nodes.map(node => {
    // Update Day 1 todo (Dec 31 - NYE Downtown)
    if (node.id === 'todo-day1-4') {
      return {
        ...node,
        data: {
          ...node.data,
          title: 'Dec 31 - NYE',
          items: [
            { id: 'item-1', text: 'Montreal Underground City (RESO)', completed: false },
            { id: 'item-2', text: 'Saint Catherine Street shopping', completed: false },
            { id: 'item-3', text: 'Christ Church Cathedral', completed: false },
            { id: 'item-4', text: 'MAC Museum of Contemporary Art', completed: false },
            { id: 'item-5', text: 'Le 9e NYE Dinner @ 6pm', completed: false },
          ]
        }
      };
    }

    // Update Day 2 todo (Jan 1 - Old Montreal)
    if (node.id === 'todo-day2-5') {
      return {
        ...node,
        data: {
          ...node.data,
          title: 'Jan 1 - Old Montreal',
          items: [
            { id: 'item-1', text: 'Walk Old Montreal cobblestones', completed: false },
            { id: 'item-2', text: 'Notre-Dame Cathedral', completed: false },
            { id: 'item-3', text: 'Old Port waterfront', completed: false },
            { id: 'item-4', text: 'La Grande Roue (Ferris wheel)', completed: false },
          ]
        }
      };
    }

    // Update Day 3 todo (Jan 2 - Religious Sites)
    if (node.id === 'todo-day3-6') {
      return {
        ...node,
        data: {
          ...node.data,
          title: 'Jan 2 - Historic Sites',
          items: [
            { id: 'item-1', text: "Saint Joseph's Oratory (Metro)", completed: false },
            { id: 'item-2', text: 'Our Lady of La Difesa', completed: false },
            { id: 'item-3', text: 'Little Italy area lunch', completed: false },
          ]
        }
      };
    }

    // Update Must See sticky
    if (node.id === 'sticky-mustsee-7') {
      return {
        ...node,
        data: {
          ...node.data,
          content: 'Must See:\n• Notre-Dame Cathedral\n• Old Montreal\n• Old Port & La Grande Roue\n• Saint Joseph\'s Oratory\n• Underground City (RESO)'
        }
      };
    }

    // Update If Time Permits sticky
    if (node.id === 'sticky-iftimepermits-8') {
      return {
        ...node,
        data: {
          ...node.data,
          content: 'If Time Permits:\n• Mount Royal viewpoint\n• Jean-Talon Market\n• Mile End bagels\n• Biodome'
        }
      };
    }

    // Update Restaurants sticky
    if (node.id === 'sticky-restaurants-9') {
      return {
        ...node,
        data: {
          ...node.data,
          content: 'Restaurants:\n• Le 9e (NYE dinner reserved!)\n• Schwartz\'s Deli (smoked meat)\n• Joe Beef\n• Au Pied de Cochon'
        }
      };
    }

    // Update Cafes sticky
    if (node.id === 'sticky-cafes-10') {
      return {
        ...node,
        data: {
          ...node.data,
          content: 'Cafes & Bars:\n• Cafe Olimpico (Mile End)\n• Crew Collective\n• Tommy Cafe\n• Notre-Dame-des-Quilles (bowling bar)'
        }
      };
    }

    return node;
  });

  // Update document
  const updateMask = 'updateMask.fieldPaths=nodes';
  const patchRes = await firestoreRequest(
    accessToken,
    'PATCH',
    `/capsules/${CAPSULE_ID}?${updateMask}`,
    { fields: { nodes: toFirestoreValue(updatedNodes) } }
  );

  if (patchRes.status === 200) {
    console.log('\nSUCCESS: Placeholder nodes updated with Montreal itinerary');
    console.log('\nUpdated:');
    console.log('- Day 1 todo: Dec 31 NYE activities');
    console.log('- Day 2 todo: Jan 1 Old Montreal');
    console.log('- Day 3 todo: Jan 2 Historic Sites');
    console.log('- Must See sticky');
    console.log('- If Time Permits sticky');
    console.log('- Restaurants sticky');
    console.log('- Cafes sticky');
  } else {
    console.error('Update failed:', patchRes.status, patchRes.data);
    process.exit(1);
  }
}

updateNodes().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
