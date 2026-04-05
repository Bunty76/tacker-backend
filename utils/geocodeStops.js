import fetch from "node-fetch";

export const getCoordinates = async (place) => {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${place}&key=${process.env.Google_API_KEY}`,
  );

  const data = await res.json();

  if (data.results.length > 0) {
    return data.results[0].geometry.location;
  }

  return null;
};
