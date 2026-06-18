const apiKey = process.env.EXPO_PUBLIC_TOMTOM_API_KEY;
const url = `https://api.tomtom.com/routing/1/calculateRoute/37.7749,-122.4194:48.8566,2.3522/json?key=${apiKey}`;
fetch(url).then(r=>r.json()).then(console.log).catch(console.error);
