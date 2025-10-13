// Format timestamps to user's local timezone
export function formatTimestamps(): void {
  const dateElements = document.querySelectorAll<HTMLElement>(
    ".update-date[data-timestamp]",
  );
  dateElements.forEach((element) => {
    const isoDate = element.getAttribute("data-timestamp");
    if (!isoDate) return;
    try {
      const date = new Date(isoDate);
      // Format the date in user's local timezone
      const formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      // Get the timezone abbreviation
      const timezone = date
        .toLocaleTimeString("en-US", {
          timeZoneName: "short",
        })
        .split(" ")
        .pop();
      // Update the element with formatted date and timezone
      element.textContent = `${formattedDate} ${timezone ?? ""}`.trim();
    } catch (error) {
      console.error("Error formatting date:", error);
    }
  });
}

export function runFormatTimestampsOnReady(): void {
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    formatTimestamps();
  } else {
    document.addEventListener("DOMContentLoaded", formatTimestamps);
  }
}
