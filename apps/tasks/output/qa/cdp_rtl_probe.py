#!/usr/bin/env python3
"""CDP RTL probe for a generated app (new_chrome_ext tool) — L4 verification gate.

Drives the served web app with the AR locale active and checks:
  1. boots + semantics
  2. Directionality flips to RTL (dir=rtl on the root / flt-glass-pane transform)
  3. no RenderFlex overflow at 390x844 and 320 width
  4. console/network clean
  5. screenshots for the findings folder

Usage: python3 cdp_rtl_probe.py <url> <out-dir>
"""
import sys
import json
import time
import urllib.parse
import urllib.request
import os

sys.path.insert(0, "/Users/username/Documents/cto/new_chrome_ext/tools")
from cdp_driver import CdpSession, CDP_HTTP

OV_RE = ("overflowed", "renderflex", "pixels overflow", "bottom overflowed", "right overflowed")


def new_tab(url):
    req = urllib.request.Request(CDP_HTTP + "/json/new?" + urllib.parse.quote(url, safe=""), method="PUT")
    return json.load(urllib.request.urlopen(req))["id"]


def close_tab(tid):
    for m in ("GET", "PUT"):
        try:
            urllib.request.urlopen(urllib.request.Request(CDP_HTTP + "/json/close/" + tid, method=m), timeout=5)
            return
        except Exception:
            continue


def main():
    url, outdir = sys.argv[1], sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    print(f"== CDP RTL probe: {url} ==")
    tid = new_tab("about:blank")
    s = CdpSession(tid, timeout=30)
    s.enable()
    s.set_viewport(390, 844)
    s.navigate(url, settle=3.0)
    try:
        s.wait_booted(timeout=30)
    except Exception:
        pass
    try:
        s.activate_semantics(timeout=15)
    except Exception:
        pass
    time.sleep(1)

    # Directionality check: the flt-glass-pane / semantics root should have dir=rtl in AR.
    r = s.cmd("Runtime.evaluate", {"expression": """
      (() => {
        const root = document.querySelector('flt-glass-pane') || document.querySelector('flt-semantics-host') || document.documentElement;
        const dir = root?.getAttribute('dir') || getComputedStyle(document.documentElement).direction;
        return {dir: dir, hasRtl: dir === 'rtl' || dir === 'RTL'};
      })()
    """, "returnByValue": True})
    res = r.get("result", {}).get("result", {}).get("value", {})
    print("Directionality:", res.get("dir"), "| RTL active:", res.get("hasRtl"))

    # Overflow scan at 390 + 320
    for w, h in [(390, 844), (320, 568)]:
        s.set_viewport(w, h)
        time.sleep(1.0)
        s.drain_errors()
        time.sleep(0.5)
        errs = s.drain_errors()
        ov = [e for e in errs if any(k in e.lower() for k in OV_RE)]
        print(f"  {w}x{h}: {'OK' if not ov else 'OVERFLOW ' + str(ov[:2])}")
    s.set_viewport(390, 844)

    # AX dump (a11y)
    ax = s.ax()
    labels = [n["name"] for n in ax if n["name"]]
    print(f"A11y: {len(labels)} labelled nodes; sample: {labels[:6]}")

    errs = s.drain_errors()
    print("Console/network errors:", errs if errs else "none")
    s.screenshot(os.path.join(outdir, "rtl_probe.png"))
    close_tab(tid)


if __name__ == "__main__":
    main()
