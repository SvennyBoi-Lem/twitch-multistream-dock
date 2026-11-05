
(() => {
  const params = new URLSearchParams(location.search);
  const parent = location.hostname;

  const videos = document.getElementById("videos");
  const chats = document.getElementById("chats");
  const status = document.getElementById("status");

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

  function streamKey(stream) {
    return stream.platform + ":" + stream.id;
  }

  // Save the current streams and update the URL without refreshing.
  function saveStreams() {
    localStorage.setItem("smd-streams", JSON.stringify(streams));

    const url = new URL(location.href);

    if (streams.length) {
      url.searchParams.set("streams", JSON.stringify(streams));
    } else {
      url.searchParams.delete("streams");
    }

    history.replaceState(null, "", url.toString());
  }

  function updateStatus() {
    status.textContent = streams.length
      ? streams.length + " stream(s) loaded"
      : "No streams loaded. Add streams using the extension.";
  }

  // Remove a stream and its matching chat immediately.
  function removeStream(key) {
    streams = streams.filter(stream => streamKey(stream) !== key);

    const videoPanel = videos.querySelector(
      '[data-stream-key="' + CSS.escape(key) + '"]'
    );

    const chatPanel = chats.querySelector(
      '[data-stream-key="' + CSS.escape(key) + '"]'
    );

    videoPanel?.remove();
    chatPanel?.remove();

    saveStreams();
    updateStatus();

    if (!streams.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent =
        "No streams loaded. Add streams using the extension.";

      videos.append(empty);
    }
  }

  function createPanel(stream, kind) {
    const panel = document.createElement("article");
    panel.className = "panel";
    panel.dataset.streamKey = streamKey(stream);

    const title = document.createElement("div");
    title.className = "panel-title";

    const platform = stream.platform.toUpperCase();

    const label = document.createElement("span");

    label.textContent = kind === "video"
      ? "LIVE · " + platform + " · " + stream.id
      : platform + " · CHAT";

    title.append(label);

    // Add a removal button to each video panel.
    if (kind === "video") {
      const removeButton = document.createElement("button");

      removeButton.className = "remove-stream";
      removeButton.type = "button";
      removeButton.textContent = "×";
      removeButton.title = "Remove stream and its chat";
      removeButton.setAttribute(
        "aria-label",
        "Remove " + platform + " stream and chat"
      );

      removeButton.addEventListener("click", () => {
        removeStream(streamKey(stream));
      });

      title.append(removeButton);
    }

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

        link.href =
          "https://kick.com/" + encodeURIComponent(stream.id);

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

  // Render both grids.
  function render() {
    videos.replaceChildren();
    chats.replaceChildren();

    if (!streams.length) {
      const empty = document.createElement("div");

      empty.className = "empty";
      empty.textContent =
        "Open a Twitch, YouTube or Kick stream, add it using the extension, and open the dashboard.";

      videos.append(empty);
    } else {
      streams.forEach(stream => {
        videos.append(createPanel(stream, "video"));
        chats.append(createPanel(stream, "chat"));
      });
    }

    updateStatus();
  }

  // Save the initial stream list.
  saveStreams();

  render();

  document.getElementById("refresh").addEventListener(
    "click",
    () => location.reload()
  );

  // Clear everything without requiring a dashboard refresh.
  document.getElementById("clear").addEventListener("click", () => {
    streams = [];
    saveStreams();
    render();
  });
})();
