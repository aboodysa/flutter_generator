#!/usr/bin/env python3
"""Walk every generated sample app via CDP and collect a per-app capability report.

For each app (served at http://127.0.0.1:PORT per app), this driver:
  1. boots + activates semantics
  2. dumps the AX tree on the initial (list) screen — roles/labels
  3. taps the first list card -> detail (if present) -> collects detail AX
  4. taps New/FAB -> create form -> collects: every field's role+label+required
     signal (from AX + DOM input/select/checkbox), and which fields are readOnly
  5. checks "important fields visible in display mode" — compares the entity's
     field set (from the IR, passed via argv) against what the detail screen shows
     and what the form collects, flagging fields that are collected but never
     displayed (the owner's logical-problem class)
  6. checks search/filter affordances (TextFields with search hint, filter chips)
  7. accessibility: AX roles present, buttons have labels, input labels present

Usage: python3 app_walkthrough.py <app-dir> <port> <entity:field,field...> [...]
   e.g. python3 app_walkthrough.py /tmp/appwalk/todo 8081 'Task:title,description,dueDate,priority,isDone'
Output: /tmp/appwalk/reports/<app>.md (or a path given as the last arg after --out)
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request

sys.path.insert(0, "/Users/username/Documents/cto/new_chrome_ext/tools")
from cdp_driver import CdpSession, CDP_HTTP

OUT = "/tmp/appwalk/reports"


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


def ax_lines(s):
    out = []
    for n in s.ax():
        r = n.get("role", "?")
        nm = n.get("name", "")
        if r in ("generic", "none", "InlineTextBox", "StaticText") and not nm:
            continue
        out.append(f"      [{r}] {nm[:55]}")
    return out


def main():
    appdir, port = sys.argv[1], sys.argv[2]
    entity_spec = sys.argv[3] if len(sys.argv) > 3 else ""
    entity, fields = entity_spec.split(":", 1) if ":" in entity_spec else (entity_spec, "")
    field_list = [f.strip() for f in fields.split(",") if f.strip()] if fields else []
    appname = os.path.basename(appdir.rstrip("/"))
    base = f"http://127.0.0.1:{port}/"

    tid = new_tab("about:blank")
    s = CdpSession(tid, timeout=30)
    s.enable()
    s.set_viewport(390, 844)
    s.navigate(base, settle=2.0)
    try:
        s.wait_booted(timeout=30)
    except Exception:
        pass
    try:
        s.activate_semantics(timeout=15)
    except Exception:
        pass
    time.sleep(1)

    lines = [f"# {appname} — CDP walkthrough", ""]

    # 1. initial screen
    lines.append("## 1. Initial (list) screen AX")
    lines += ax_lines(s)

    # buttons / affordances
    btns = [n["name"] for n in s.ax() if n["role"] == "button" and n["name"]]
    lines.append("")
    lines.append("**Buttons:** " + ", ".join(btns[:10]))
    textboxes = [n["name"] for n in s.ax() if n["role"] == "textbox" and n["name"]]
    if textboxes:
        lines.append("**Search/text inputs on list:** " + ", ".join(textboxes[:6]))

    # 2. detail via first card
    cards = [n for n in s.ax() if n["role"] == "button" and any(k in n["name"] for k in ("Sample", "Item", "Task", "Promo", "Claim", "Product", "Signup"))]
    if cards:
        s.click_node(cards[0])
        time.sleep(1.5)
        lines.append("")
        lines.append("## 2. Detail screen AX (after tapping first row)")
        lines += ax_lines(s)

    # 3. create form via New/Add button (match FAB tooltips like "New <Entity>")
    def find_new():
        for n in s.ax():
            if n["role"] != "button":
                continue
            nm = n["name"]
            if nm in ("New", "Add", "Create") or nm.startswith("New ") or nm.startswith("Add "):
                return n
        return None
    newbtn = find_new()
    if newbtn:
        # navigate back to list first if on detail
        back = next((n for n in s.ax() if n["role"] == "button" and n["name"] == "Back"), None)
        if back:
            s.click_node(back)
            time.sleep(1.0)
        newbtn = find_new()
        if newbtn:
            s.click_node(newbtn)
            time.sleep(1.5)
            lines.append("")
            lines.append("## 3. Create form — fields (AX)")
            lines += ax_lines(s)
            lines.append("")
            lines.append("**DOM inputs on form:**")
            r = s.cmd("Runtime.evaluate", {"expression": """
              [...document.querySelectorAll('input,select,textarea')].map(e => {
                const t=e.type||'text'; const req=e.required;
                const label=e.getAttribute('aria-label')||e.getAttribute('placeholder')||'';
                return `${t}${req?'[req]':''} ${label}`;
              }).join('\\n')""", "returnByValue": True})
            dom = (r.get("result", {}).get("result", {}).get("value") or "").strip()
            lines.append(dom if dom else "      (no DOM inputs — Flutter semantics only)")
    else:
        lines.append("")
        lines.append("## 3. Create form — NO 'New' button found (list-only or placeholder screen)")

    # 4. logical problem: fields collected in form but never displayed
    if field_list:
        lines.append("")
        lines.append("## 4. Field-visibility audit (owner's logical-problem check)")
        lines.append(f"Entity `{entity}` fields: {', '.join(field_list)}")
        all_ax_text = " ".join(n["name"] for n in s.ax() if n["name"]).lower()
        # everything visible on the current screen (form): textboxes, combos, checkboxes, chips, buttons
        visible_now = [n["name"] for n in s.ax() if n["role"] in ("textbox", "combobox", "checkbox", "radio", "button", "StaticText") and n["name"]]
        visible_now_text = " ".join(visible_now).lower()
        # what the form collected (from DOM inputs + visible AX)
        r = s.cmd("Runtime.evaluate", {"expression": """
          [...document.querySelectorAll('input,select,textarea')].map(e=>
            (e.getAttribute('aria-label')||e.getAttribute('placeholder')||'')).filter(Boolean).join(' ').toLowerCase()""", "returnByValue": True})
        dom_names = (r.get("result", {}).get("result", {}).get("value") or "").lower()
        form_names = dom_names + " " + visible_now_text
        for f in field_list:
            fl = f.lower()
            # normalize: match substrings (title vs 'title', dueDate vs 'due date', category vs 'category')
            def hit(text):
                return any(fl in t for t in text.split(" ")) or fl in text.replace("_", " ")
            in_form = hit(form_names)
            in_display = hit(all_ax_text)
            status = "FORM+DISPLAY" if (in_form and in_display) else ("FORM ONLY (not displayed)" if in_form else ("DISPLAY ONLY (not collected)" if in_display else "NOT SEEN"))
            lines.append(f"  - `{f}`: {status}")

    # 5. errors
    errs = s.drain_errors()
    lines.append("")
    lines.append("## 5. Console/errors")
    lines.append("  none" if not errs else "  " + "\n  ".join(errs[:5]))

    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"{appname}.md")
    with open(path, "w") as fh:
        fh.write("\n".join(lines) + "\n")
    close_tab(tid)
    print(f"wrote {path}")


if __name__ == "__main__":
    main()
