const API_KEY = "AIzaSyA4aIJgb1GNi9549MYryySgRluThIazAxw";
const MODEL = 'gemini-3-flash-preview';

async function run() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Hello` }] }]
      })
    });
    const data = await response.json();
    console.log("RESPONSE DATA:");
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("CATCH ERROR:", err);
  }
}
run();
