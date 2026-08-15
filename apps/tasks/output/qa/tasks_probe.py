#!/usr/bin/env python3
"""AX / a11y / overflow probe of the generated 'tasks' Flutter web app (mall-session pattern).

Drives the release build served at /tasks/ (or 127.0.0.1:8081) via CFT/CDP.
Checks, in order:
  1. boot + semantics activation (AX tree present)
  2. full AX tree dump (roles/labels) for a11y review
  3. console/network errors on load
  4. tap first card -> detail; check back affordance; return
  5. open the new-task form; dump input kinds (date/priority/status selectors, keyboard)
  6. overflow scan: resize through iPhone/tablet/desktop viewports, capture RenderFlex
  7. focus/keyboard visibility probe on the form's first field

Usage: python3 tools/tasks_probe.py [url]
"""
import json
import sys
import time
import urllib.parse
import urllib.request
from websocket import create_connection

sys.path.insert(0, "/Users/username/Documents/cto/new_chrome_ext/tools")
from cdp_driver import CdpSession, CDP_HTTP  # noqa: E402

URL = sys.argv[1] if len(sys.argv) > 1 else "https://macbook-air-m4-1.taild16060.ts.net/tasks/"
OV_RE = ("overflowed", "renderflex", "pixels overflow", "bottom overflowed", "right overflowed",
         "left overflowed", "top overflowed", "failed assertion", "exceeded", "is not a subtype",
         "typeerror", "cast error", "null check operator", "was called on null", "unhandled exception")
OUT = "/Users/username/Documents/cto/flutter_generator/apps/tasks/output/qa"


def new_tab(url):
    req = urllib.request.Request(CDP_HTTP + "/json/new?" + urllib.parse.quote(url, safe=""), method="PUT")
    return json.load(urllib.request.urlopen(req))["id"]


def close_tab(tid):
    for method in ("GET", "PUT"):
        try:
            urllib.request.urlopen(urllib.request.Request(CDP_HTTP + "/json/close/" + tid, method=method), timeout=5)
            return
        except Exception:
            continue


def eval_ret(s, expr):
    r = s.cmd("Runtime.evaluate", {"expression": expr, "returnByValue": True})
    return r.get("result", {}).get("result", {}).get("value")


def main():
    print(f"== tasks AX/a11y/overflow probe: {URL} ==")
    tid = new_tab("about:blank")
    try:
        s = CdpSession(tid, timeout=30)
        s.enable()
        s.set_viewport(390, 844)
        s.navigate(URL, settle=2.0)
        try:
            s.wait_booted(timeout=30)
            print("[boot] ok")
        except Exception:
            print("[boot] WARNING: wait_booted timeout")
        try:
            s.activate_semantics(timeout=20)
            print("[semantics] activated")
        except Exception as e:
            print("[semantics] FAILED:", e)

        print("\n--- FULL AX TREE (a11y) ---")
        ax = s.ax()
        printed = 0
        for n in ax:
            role = n.get("role", "?")
            name = n.get("name", "")
            if role in ("generic", "none") and not name:
                continue
            line = f"  [{role}] {name[:55]}"
            print(line)
            printed += 1
            if printed >= 60:
                print("  ... (truncated)")
                break

        print("\n--- console/network errors on load ---")
        errs = s.drain_errors()
        print("errors:", errs if errs else "none")

        print("\n--- TAP first card -> detail ---")
        allbtns = [n for n in s.ax() if n["role"] == "button"]
        card = next((n for n in allbtns if "2024-01-01" in n["name"] or "Sample item" in n["name"]), allbtns[0] if allbtns else None)
        if card:
            s.click_node(card)
            print("clicked:", card["name"][:50])
        else:
            print("NO card button found")
        time.sleep(1.5)
        s.screenshot(f"{OUT}/probe_detail.png")
        print("url:", s.url())
        back = s.wait_ax(role="button", name="Back", timeout=3)
        print("back affordance:", "FOUND Back" if back else "NO back button (top-left back chevron absent?)")

        print("\n--- open edit form from detail (Edit icon) ---")
        edit = s.wait_ax(role="button", name="Edit", timeout=3)
        if edit:
            s.click_node(edit)
            print("clicked Edit")
        else:
            print("NO Edit button")
        time.sleep(1.5)
        s.screenshot(f"{OUT}/probe_form.png")
        print("url after Edit:", s.url())

        print("\n--- form input kinds (selectors/keyboard) ---")
        print(eval_ret(s, """
            (() => {
              const els = [...document.querySelectorAll('input, select, textarea, flt-semantics')];
              return els.map(e => {
                const t = e.tagName;
                const type = e.getAttribute('type') || '';
                const label = e.getAttribute('aria-label') || e.getAttribute('placeholder') || '';
                const role = e.getAttribute('role') || '';
                return `${t} type=${type} role=${role} label=${label}`;
              }).slice(0, 30).join('\\n');
            })()
        """))

        print("\n--- focus + keyboard visibility (first text field) ---")
        print(eval_ret(s, """
            (() => {
              const inp = document.querySelector('input');
              if (!inp) return 'no <input> element found';
              inp.focus();
              return 'focused input: ' + (inp.getAttribute('aria-label')||inp.getAttribute('placeholder')||'?');
            })()
        """))

        print("\n--- OVERFLOW SCAN (viewports) ---")
        for w, h in [(320, 568), (390, 844), (768, 1024), (1280, 800)]:
            s.set_viewport(w, h)
            time.sleep(1.0)
            s.drain_errors()
            time.sleep(0.5)
            errs = s.drain_errors()
            ov = [e for e in errs if any(k in e.lower() for k in OV_RE)]
            print(f"  {w}x{h}: {'OK' if not ov else ov[:2]}")
        s.set_viewport(390, 844)

        errs = s.drain_errors()
        print("\nfinal console errors:", errs if errs else "none")
    finally:
        close_tab(tid)


if __name__ == "__main__":
    main()
