(() => {
  const params = new URLSearchParams(location.search);
  const fromUrl = (params.get("channels") || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  const valid = fromUrl.filter(x => /^[a-z0-9_]{1,25}$/.test(x)).slice(0, 4);
  const saved = (() => { try { return JSON.parse(localStorage.getItem("tmd-channels") || "[]"); } catch { return []; } })();
  const channels = valid.length ? valid : saved.filter(x => /^[a-z0-9_]{1,25}$/.test(x)).slice(0,4);
  const parent = location.hostname;
  const videos = document.getElementById("videos");
  const chats = document.getElementById("chats");
  document.getElementById("domain").textContent = "Twitch parent: " + parent;
  document.getElementById("status").textContent = channels.length
    ? channels.length + " channel(s) loaded"
    : "No channels supplied yet. Add channels using the Opera extension.";

  function makePanel(channel, kind) {
    const panel = document.createElement("article");
    panel.className = "panel";
    const label = document.createElement("div");
    label.className = "panel-title";
    label.textContent = kind === "video" ? "LIVE · " + channel : channel + " · CHAT";
    const frame = document.createElement("iframe");
    frame.allow = kind === "video" ? "autoplay; fullscreen; picture-in-picture" : "clipboard-write";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.title = channel + (kind === "video" ? " Twitch stream" : " Twitch chat");
    if (kind === "video") {
      frame.className = "video-frame";
      frame.src = "https://player.twitch.tv/?channel=" + encodeURIComponent(channel) +
        "&parent=" + encodeURIComponent(parent) + "&muted=" + (channels.indexOf(channel) === 0 ? "false" : "true");
    } else {
      frame.className = "chat-frame";
      frame.src = "https://www.twitch.tv/embed/" + encodeURIComponent(channel) +
        "/chat?parent=" + encodeURIComponent(parent) + "&darkpopout";
    }
    panel.append(label, frame);
    return panel;
  }

  if (!channels.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Open a Twitch channel in Opera, use the Multistream Dock extension to add it, then choose Open Dashboard.";
    videos.append(empty);
  } else {
    localStorage.setItem("tmd-channels", JSON.stringify(channels));
    channels.forEach(channel => videos.append(makePanel(channel, "video")));
    channels.forEach(channel => chats.append(makePanel(channel, "chat")));
  }

  document.getElementById("refresh").addEventListener("click", () => location.reload());
  document.getElementById("clear").addEventListener("click", () => {
    localStorage.removeItem("tmd-channels");
    location.href = location.pathname;
  });
})();
