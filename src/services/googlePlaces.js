const PLACES_AUTOCOMPLETE_URL =
  'https://maps.googleapis.com/maps/api/place/autocomplete/json';

const HALIFAX_LOCATION = '44.6488,-63.5752';
const SEARCH_RADIUS_METRES = 30000;

export async function fetchAddressSuggestions(input, sessionToken) {
  if (!input || input.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    input,
    types: 'address',
    location: HALIFAX_LOCATION,
    radius: SEARCH_RADIUS_METRES,
    components: 'country:ca',
    language: 'en',
    sessiontoken: sessionToken,
    key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
  });

  const response = await fetch(`${PLACES_AUTOCOMPLETE_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`Places request failed with status ${response.status}.`);
  }

  const data = await response.json();

  if (data.status === 'ZERO_RESULTS') {
    return [];
  }

  if (data.status !== 'OK') {
    throw new Error(data.error_message || `Places API error: ${data.status}`);
  }

  return data.predictions.map((prediction) => ({
    placeId: prediction.place_id,
    description: prediction.description,
  }));
}
