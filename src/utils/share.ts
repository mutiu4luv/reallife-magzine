export type ShareContent = {
  title: string;
  text?: string;
  path: string;
};

const getShareUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (typeof window === "undefined") {
    return path;
  }

  return new URL(path, window.location.origin).toString();
};

const getPreviewSharePath = (path: string) => {
  if (path.match(/^\/king--Sunny-Ade-@80(?:[/?#]|$)/)) {
    return "/api/share?kind=kingSunnyAde";
  }

  const match = path.match(/^\/(blog|news|events|magazine|interviews|testimonies|past-editions|gallery)\/([^/?#]+)/);

  if (!match) {
    return path;
  }

  const kindBySection: Record<string, string> = {
    blog: "post",
    news: "news",
    events: "event",
    magazine: "magazine",
    interviews: "interview",
    testimonies: "testimony",
    "past-editions": "pastEdition",
    gallery: "photo",
  };

  const kind = kindBySection[match[1]];
  const id = decodeURIComponent(match[2]);
  return `/api/share?kind=${encodeURIComponent(kind)}&id=${encodeURIComponent(id)}`;
};

export const shareContent = async ({ title, text, path }: ShareContent) => {
  const url = getShareUrl(getPreviewSharePath(path));

  if (navigator.share) {
    await navigator.share({ title, text, url });
    return "shared";
  }

  await navigator.clipboard.writeText(url);
  return "copied";
};
