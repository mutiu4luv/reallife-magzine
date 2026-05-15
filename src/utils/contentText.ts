export const stripHtml = (value = "") => {
  if (!value) {
    return "";
  }

  if (typeof window === "undefined") {
    return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  const element = window.document.createElement("div");
  element.innerHTML = value;
  return (element.textContent || element.innerText || "").replace(/\s+/g, " ").trim();
};

export const toExcerpt = (value = "", maxLength = 150) => {
  const text = stripHtml(value);

  if (text.length <= maxLength) {
    return text;
  }

  const trimmed = text.slice(0, maxLength).replace(/\s+\S*$/, "").trim();
  return `${trimmed || text.slice(0, maxLength).trim()}...`;
};
