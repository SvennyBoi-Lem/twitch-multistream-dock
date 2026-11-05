
(() => {
  const params = new URLSearchParams(location.search);
  const parent = location.hostname;

  const videos = document.getElementById("videos");
  const chats = document.getElementById("chats");

  function validStream(stream) {
    if (!stream || typeof stream.id !== "string") return false;

    if (stream.platform === "twitch") {
      return /^[a-z0-9_]{1,25}$/i.test(stream.id);
    }

    if (stream.platform === "youtube") {
      return /^[a-zA-Z0-9_-]{11}$/.test(stream.id);
    }

    if (stream.platform === "kick") {
      return /^[a-z0-9_]{1,25}$/i.test(stream.id);
    }

    return false;
  }

  let streams = [];

  try {
    const incoming = JSON.parse(params.get("streams") || "[]");

    if (Array.isArray(incoming)) {
      streams = incoming.filter(validStream).slice(0, 8);
    }
  } catch {
    streams = [];
  }

  if (!streams.length) {
    try {
      const saved = JSON.parse(
        localStorage.getItem("smd-streams") || "[]"
      );

      if (Array.isArray(saved)) {
        streams = saved.filter(validStream).slice(0, 8);
      }
    } catch {
      streams = [];
    }
  }

  const status = document.getElementById("status");

  status.textContent = streams.length
    ? streams.length + " stream(s) loaded"
    : "No streams loaded. Add streams using the extension.";

  function createPanel(stream, kind) {
    const panel = document.createElement("article");
    panel.className = "panel";

    const title = document.createElement("div");
    title.className = "panel-title";

    const platform = stream.platform.toUpperCase();

    title.textContent = kind === "video"
      ? "LIVE · " + platform + " · " + stream.id
      : platform + " · CHAT";

    const frame = document.createElement("iframe");

    frame.allow =
      "autoplay; fullscreen; picture-in-picture; encrypted-media";

    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";

    if (kind === "video") {
      frame.className = "video-frame";

      if (stream.platform === "twitch") {
        frame.src =
          "https://player.twitch.tv/?channel=" +
          encodeURIComponent(stream.id) +
          "&parent=" + encodeURIComponent(parent) +
          "&muted=true&autoplay=true";
      }

      if (stream.platform === "youtube") {
        frame.src =
          "https://www.youtube.com/embed/" +
          encodeURIComponent(stream.id) +
          "?autoplay=1&mute=1&playsinline=1";
      }

      if (stream.platform === "kick") {
        frame.src =
          "https://player.kick.com/" +
          encodeURIComponent(stream.id) +
          "?autoplay=true&muted=true";
      }
    } else {
      frame.className = "chat-frame";

      if (stream.platform === "twitch") {
        frame.src =
          "https://www.twitch.tv/embed/" +
          encodeURIComponent(stream.id) +
          "/chat?parent=" + encodeURIComponent(parent) +
          "&darkpopout";
      }

      if (stream.platform === "youtube") {
        frame.src =
          "https://www.youtube.com/live_chat?v=" +
          encodeURIComponent(stream.id) +
          "&embed_domain=" + encodeURIComponent(parent);
      }

      if (stream.platform === "kick") {
        const message = document.createElement("div");
        message.style.padding = "16px";
        message.style.color = "#efeff1";
        message.textContent =
          "Kick chat is not available as a verified official embed yet.";

        const link = document.createElement("a");
        link.href = "https://kick.com/" + encodeURIComponent(stream.id);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Open Kick chat";
        link.style.color = "#53fc18";

        panel.append(title, message, link);
        return panel;
      }
    }

    frame.title = platform + " " + stream.id + " " + kind;

    panel.append(title, frame);

    return panel;
  }

  if (!streams.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent =
      "Open a Twitch, YouTube or Kick stream, add it using the extension, and open the dashboard.";

    videos.append(empty);
  } else {
    localStorage.setItem("smd-streams", JSON.stringify(streams));

    streams.forEach(stream => {
      videos.append(createPanel(stream, "video"));
      chats.append(createPanel(stream, "chat"));
    });
  }

  document.getElementById("refresh").addEventListener(
    "click",
    () => location.reload()
  );

  document.getElementById("clear").addEventListener("click", () => {
    localStorage.removeItem("smd-streams");
    location.href = location.pathname;
  });
})();
