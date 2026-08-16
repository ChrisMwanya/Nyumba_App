const apiKey = process.env.EXPO_PUBLIC_TOMTOM_API_KEY;
if(!apiKey) { console.log("NO KEY"); process.exit(1); }
const url = `https://api.tomtom.com/routing/1/calculateRoute/48.8566,2.3522:48.8584,2.2945/json?key=${apiKey}`;
fetch(url).then(r=>r.json()).then(d=>console.log(d.error || d.routes?.[0]?.summary || d)).catch(console.error);
