/**
 * Neutral blank placeholder for pets without a custom photo.
 * Avoids showing confusing demo pet models (like Thor or Mia) to real tutors.
 */
export const BLANK_PET_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600" fill="none"><rect width="600" height="600" fill="%23f3f4f6"/><g opacity="0.6"><circle cx="300" cy="250" r="85" fill="%23cbd5e1"/><ellipse cx="235" cy="170" rx="32" ry="50" transform="rotate(-20 235 170)" fill="%23cbd5e1"/><ellipse cx="365" cy="170" rx="32" ry="50" transform="rotate(20 365 170)" fill="%23cbd5e1"/><ellipse cx="300" cy="440" rx="140" ry="95" fill="%23cbd5e1"/></g><text x="300" y="555" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="%2394a3b8" text-anchor="middle">Sem foto cadastrada</text></svg>';

export const getPetPhoto = (fotoUrl) => {
  if (fotoUrl && typeof fotoUrl === "string" && fotoUrl.trim() !== "") {
    return fotoUrl;
  }
  return BLANK_PET_IMAGE;
};
