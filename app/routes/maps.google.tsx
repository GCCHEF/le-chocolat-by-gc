import {redirect} from 'react-router';

const GOOGLE_MAPS_DIRECTIONS_URL =
  'https://www.google.com/maps/dir/?api=1&destination=Makers%20Landing%2C%20Cape%20Town%20Cruise%20Terminal%2C%20V%26A%20Waterfront%2C%20Cape%20Town%2C%20South%20Africa&travelmode=driving';

export function loader() {
  return redirect(GOOGLE_MAPS_DIRECTIONS_URL);
}
