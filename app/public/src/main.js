async function boot() {
  const root = document.getElementById("app");
  if (!root) return;

  try {
    const mod = await import("./app-shell.js");
    if (typeof mod.startAppShell === "function") {
      mod.startAppShell(root);
      return;
    }
    throw new Error("startAppShell export missing");
  } catch (error) {
    root.innerHTML = `
      <main class="shell-fallback">
        <h1>CEM CULTURE</h1>
        <p>Application shell failed to initialize.</p>
        <pre>${String(error?.message || error)}</pre>
      </main>
    `;
  }
}

boot();
