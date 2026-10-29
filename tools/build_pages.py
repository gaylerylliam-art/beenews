# -*- coding: utf-8 -*-
"""Builds privacy.html, terms.html and editorial.html from tools/legal_content.py.
Run from the repo root: python3 tools/build_pages.py"""
import re, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from legal_content import PRIVACY, TERMS, EDITORIAL, UPDATED

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title} · BeeNews</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#0f172a">
<link rel="icon" href="/icons/icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="/css/app.css">
<link rel="stylesheet" href="/css/modern.css">
<link rel="stylesheet" href="/css/pages.css">
</head>
<body>
<header id="pgHead"></header>
"""
FOOT = """<footer id="pgFoot"></footer>
<script src="/config.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
<script src="/js/page.js"></script>
</body>
</html>
"""

def ph(html):
    html = re.sub(r'<span class="ph">\[\[(.*?)\]\]</span>', r'<span class="ph">\1</span>', html)
    return re.sub(r'\[\[(.*?)\]\]', r'<span class="ph">\1</span>', html)

def page(name, doc, title, desc):
    body = ['<main class="pg-main doc">',
            '<div class="pg-draft" id="pgDraft"><i class="fa-solid fa-scale-balanced" aria-hidden="true"></i><span></span></div>',
            '<p class="lang-note" id="docLangNote" hidden></p>']
    for l in ("en", "ar"):
        body.append(f'<article data-doc-lang="{l}" lang="{l}" dir="{"rtl" if l=="ar" else "ltr"}">'
                    + ph(doc[l].replace("{updated}", UPDATED[l])) + '</article>')
    body.append('</main>')
    with open(name, "w", encoding="utf-8") as f:
        f.write(HEAD.format(title=title, desc=desc) + "\n".join(body) + "\n" + FOOT)
    print("wrote", name)

page("privacy.html", PRIVACY, "Privacy policy", "How BeeNews collects, uses and protects personal data.")
page("terms.html", TERMS, "Terms of use", "The terms for using the BeeNews website and apps.")
page("editorial.html", EDITORIAL, "Editorial policy", "How BeeNews chooses, checks, labels and corrects stories.")
