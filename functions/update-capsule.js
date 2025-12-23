const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function updateCapsule() {
  const CAPSULE_ID = 'montreal-trip-dec2025';

  const montrealPlaces = [
    { id: 'place-1', name: 'Old Montreal', formattedAddress: 'Vieux-Montréal, Montreal, QC', lat: 45.5048, lng: -73.5572, category: 'attraction', distanceFromBase: { text: '0.3 km', duration: '4 min', meters: 300 }, assignedDay: 1 },
    { id: 'place-2', name: 'Notre-Dame Basilica', formattedAddress: '110 Rue Notre-Dame O, Montréal', lat: 45.5046, lng: -73.5560, category: 'attraction', distanceFromBase: { text: '0.4 km', duration: '5 min', meters: 400 }, assignedDay: 1 },
    { id: 'place-3', name: 'Mount Royal', formattedAddress: 'Parc du Mont-Royal, Montréal', lat: 45.5048, lng: -73.5877, category: 'activity', distanceFromBase: { text: '2.5 km', duration: '32 min', meters: 2500 }, assignedDay: 2 },
    { id: 'place-4', name: 'Schwartz Deli', formattedAddress: '3895 St Laurent Blvd, Montréal', lat: 45.5168, lng: -73.5792, category: 'restaurant', distanceFromBase: { text: '1.8 km', duration: '23 min', meters: 1800 }, assignedDay: 1 },
    { id: 'place-5', name: 'Jean-Talon Market', formattedAddress: '7070 Henri Julien Ave, Montréal', lat: 45.5369, lng: -73.6147, category: 'shopping', distanceFromBase: { text: '5.2 km', duration: '65 min', meters: 5200 }, assignedDay: 2 },
    { id: 'place-6', name: 'Mile End', formattedAddress: 'Mile End, Montréal', lat: 45.5256, lng: -73.5969, category: 'activity', distanceFromBase: { text: '3.5 km', duration: '44 min', meters: 3500 }, assignedDay: 2 },
    { id: 'place-7', name: 'Biodome', formattedAddress: '4777 Pierre-De Coubertin Ave, Montréal', lat: 45.5612, lng: -73.5466, category: 'attraction', distanceFromBase: { text: '6.5 km', duration: '20 min transit', meters: 6500 }, assignedDay: 3 },
    { id: 'place-8', name: 'Fine Arts Museum', formattedAddress: '1380 Sherbrooke St W, Montréal', lat: 45.4986, lng: -73.5793, category: 'attraction', distanceFromBase: { text: '1.2 km', duration: '15 min', meters: 1200 }, assignedDay: 1 }
  ];

  const capsuleRef = db.collection('capsules').doc(CAPSULE_ID);
  const doc = await capsuleRef.get();

  if (doc.exists === false) {
    console.log('Capsule does not exist');
    process.exit(1);
  }

  const existingData = doc.data();
  const nodes = existingData.nodes || [];
  console.log('Current nodes:', nodes.length);

  const filteredNodes = nodes.filter(n => n.type !== 'mapNode' && n.type !== 'tripPlannerMapNode');
  console.log('After filter:', filteredNodes.length);

  const googlePlacesKey = '***REMOVED***';

  filteredNodes.push({
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
        { groupId: 1, suggestedDay: 'Day 1', places: ['Old Montreal', 'Notre-Dame Basilica', 'Fine Arts Museum', 'Schwartz Deli'], count: 4 },
        { groupId: 2, suggestedDay: 'Day 2', places: ['Mile End', 'Jean-Talon Market', 'Mount Royal'], count: 3 },
        { groupId: 3, suggestedDay: 'Day 3', places: ['Biodome'], count: 1 }
      ],
      aiSuggestion: 'Based on proximity: Day 1 - Old Montreal area (Notre-Dame, Fine Arts Museum, Schwartz for dinner). Day 2 - Mile End for bagels, Jean-Talon Market, Mount Royal sunset. Day 3 - Biodome via transit.'
    }
  });

  console.log('Final nodes:', filteredNodes.length);

  await capsuleRef.update({
    nodes: filteredNodes,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('Done! View at: https://yellowcircle.io/unity-notes/view/montreal-trip-dec2025');
  process.exit(0);
}

updateCapsule().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
