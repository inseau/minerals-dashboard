// Maps this dataset's country identifiers to the "properties.name" values
// used in the world-atlas (Natural Earth) topojson bundled at
// /public/world-110m.json, so the choropleth can match rows to shapes.
export const COUNTRY_NAME_ALIASES: Record<string, string> = {
  Argentina: "Argentina",
  Australia: "Australia",
  Austria: "Austria",
  Belgium: "Belgium",
  Bolivia: "Bolivia",
  Brazil: "Brazil",
  Canada: "Canada",
  Chile: "Chile",
  China: "China",
  Cuba: "Cuba",
  DRC: "Dem. Rep. Congo",
  France: "France",
  Gabon: "Gabon",
  Ghana: "Ghana",
  India: "India",
  Indonesia: "Indonesia",
  Japan: "Japan",
  Madagascar: "Madagascar",
  Malaysia: "Malaysia",
  Mongolia: "Mongolia",
  Mozambique: "Mozambique",
  Myanmar: "Myanmar",
  NewCaledonia: "New Caledonia",
  Nigeria: "Nigeria",
  Peru: "Peru",
  Philippines: "Philippines",
  Russia: "Russia",
  Rwanda: "Rwanda",
  SouthAfrica: "South Africa",
  SouthKorea: "South Korea",
  Tajikistan: "Tajikistan",
  USA: "United States of America",
  Vietnam: "Vietnam",
  Zambia: "Zambia",
  Zimbabwe: "Zimbabwe",
};

// Reverse lookup: topojson name -> dataset country code
export const NAME_TO_DATASET_COUNTRY: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_NAME_ALIASES).map(([code, name]) => [name, code])
);
