const apiKey = process.env.EXPO_PUBLIC_TOMTOM_API_KEY;
const url = `https://api.tomtom.com/routing/1/calculateRoute/48.8566,2.3522:48.8584,2.2945/json?key=${apiKey}`;
fetch(url).then(r=>r.json()).then(d=>console.log(d.routes[0].legs[0].points[0])).catch(console.error);
