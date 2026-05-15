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

export const shareContent = async ({ title, text, path }: ShareContent) => {
  const url = getShareUrl(path);

  if (navigator.share) {
    await navigator.share({ title, text, url });
    return "shared";
  }

  await navigator.clipboard.writeText(url);
  return "copied";
};
