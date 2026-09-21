# Yale Landing — yalelandingabq.com

Production build of the Yale Landing website, served by GitHub Pages at
**https://yalelandingabq.com** (`CNAME` in this repo). yalelanding.com and
2500yalelanding.com redirect here from the registrar.

Pages are indexed and `sitemap.xml` is published. Paths are root-absolute,
so this build only works at the custom domain — not at a `github.io/REPO/`
address.

`/pdf` redirects straight to the current leasing brochure
(`assets/lease/yale-landing-leasing-brochure.pdf`). It is the link used in
email campaigns.

Source lives in the `yale-site` folder next to this clone. Rebuild with
`python3 build.py` there and copy `docs/` over this folder — never edit
these files directly.
