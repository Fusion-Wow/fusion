/** Convert milliseconds to MM:SS string */
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Deduplicate report codes (in case two chars appeared in the same log) */
function uniqueReports(reports) {
  const seen = new Set();
  return reports.filter((r) => {
    if (seen.has(r.code)) return false;
    seen.add(r.code);
    return true;
  });
}

export { formatDuration, uniqueReports };
