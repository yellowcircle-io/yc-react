/**
 * Re-seed Montreal Trip Planner with TripPlannerMapNode
 * Uses Firebase CLI's OAuth token for authentication
 * Run: ACCESS_TOKEN="..." node reseed-with-token.js
 */

const admin = require('firebase-admin');

// Custom credential using access token from environment
class TokenCredential {
  constructor(accessToken) {
    this.accessToken = accessToken;
  }

  getAccessToken() {
    return Promise.resolve({
      access_token: this.accessToken,
      expires_in: 3600
    });
  }
}

const accessToken = process.env.ACCESS_TOKEN;
if (!accessToken) {
  console.error('ACCESS_TOKEN environment variable required');
  process.exit(1);
}

admin.initializeApp({
  credential: new TokenCredential(accessToken),
  projectId: 'yellowcircle-app'
});

const db = admin.firestore();

async function reseed() {
  const CAPSULE_ID = 'montreal-trip-dec2025';
  const googlePlacesKey = '***REMOVED***';

  console.log('Updating capsule:', CAPSULE_ID);

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
      aiSuggestion: "Based on proximity: Day 1 - Old Montreal area (Notre-Dame, Fine Arts Museum, Schwartz's for dinner). Day 2 - Mile End for bagels, Jean-Talon Market, Mount Royal sunset. Day 3 - Biodome via transit."
    }
  };

  try {
    const capsuleRef = db.collection('capsules').doc(CAPSULE_ID);
    const doc = await capsuleRef.get();

    if (doc.exists === false) {
      console.error('Capsule not found');
      process.exit(1);
    }

    const data = doc.data();
    const nodes = data.nodes || [];
    console.log('Current nodes:', nodes.length);

    const filtered = nodes.filter(n => n.type !== 'mapNode' && n.type !== 'tripPlannerMapNode');
    console.log('After removing old maps:', filtered.length);

    filtered.push(tripPlannerNode);
    console.log('After adding new map:', filtered.length);

    await capsuleRef.update({
      nodes: filtered,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('');
    console.log('✅ SUCCESS: Capsule updated with TripPlannerMapNode');
    console.log('');
    console.log('View at: https://yellowcircle.io/unity-notes/view/montreal-trip-dec2025');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

reseed();
