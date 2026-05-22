import { app as i, BrowserWindow as r, ipcMain as d } from "electron";
import { createRequire as p } from "node:module";
import { fileURLToPath as w } from "node:url";
import o from "node:path";
p(import.meta.url);
const t = o.dirname(w(import.meta.url));
process.env.APP_ROOT = o.join(t, "..");
const s = process.env.VITE_DEV_SERVER_URL, P = o.join(process.env.APP_ROOT, "dist-electron"), a = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = s ? o.join(process.env.APP_ROOT, "public") : a;
let e;
function c() {
  e = new r({
    icon: o.join(process.env.VITE_PUBLIC, "logo-unab.svg"),
    // Icono de ventana
    width: 1200,
    // Ancho inicial
    height: 800,
    // Alto inicial
    frame: !1,
    // Sin frame del SO (uso custom title bar)
    webPreferences: {
      preload: o.join(t, "preload.mjs")
      // Script preload (acceso a IPC seguro)
      // Más preferencias de seguridad se pueden añadir aquí
    }
  }), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), e.setMenu(null), s ? e.loadURL(s) : e.loadFile(o.join(a, "index.html"));
}
i.on("window-all-closed", () => {
  process.platform !== "darwin" && (i.quit(), e = null);
});
i.on("activate", () => {
  r.getAllWindows().length === 0 && c();
});
d.on("window-controls", (l, m) => {
  const n = r.fromWebContents(l.sender);
  if (n)
    switch (m) {
      case "minimize":
        n.minimize();
        break;
      case "maximize":
        n.isMaximized() ? n.restore() : n.maximize();
        break;
      case "close":
        n.close();
        break;
    }
});
i.whenReady().then(c);
export {
  P as MAIN_DIST,
  a as RENDERER_DIST,
  s as VITE_DEV_SERVER_URL
};
