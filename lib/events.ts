/** Fired on `window` when a timeline card asks the world map to show a location. */
export const FOCUS_LOCATION_EVENT = "logpose:focus-location";

export interface FocusLocationDetail {
  locationId: string;
}

/** Scroll to the world map and centre it on a location. */
export function focusLocationOnMap(locationId: string): void {
  window.dispatchEvent(new CustomEvent<FocusLocationDetail>(FOCUS_LOCATION_EVENT, { detail: { locationId } }));
  document.getElementById("map")?.scrollIntoView({ behavior: "smooth", block: "start" });
}
