# girisharora.com

Personal website of Girish Arora. Plain HTML, CSS, and a little JavaScript. GitHub Pages builds and hosts it.

## Where things are

| What | Where |
|------|-------|
| Source text for the whole site | `content/site-content.md` |
| Original photos | `content/photos/` (not published) |
| Home page (all sections, including Contact) | `index.html` |
| Blog list page | `blog.html` |
| Header, footer, page shell | `_layouts/base.html` |
| Blog post page design | `_layouts/post.html` |
| Image slot (shows a photo or a placeholder) | `_includes/slot.html` |
| Blog posts | `_posts/` |
| Styles | `assets/css/style.css` |
| Scroll animations and photo enlarge | `assets/js/main.js` |
| Hero circuit animation | `assets/js/hero.js` |
| ALD process strip | `assets/js/scroll-fx.js` |
| Shared trace drawing code | `assets/js/traces.js` |
| Web-sized photos | `assets/img/` |
| Custom domain | `CNAME` |
| Site settings (email, links) | `_config.yml` |

## Fill an image slot

Each project card and the QNF experience entry has an image slot. Upload a JPG to the matching path and the placeholder is replaced on the next build. No HTML edit needed.

| Slot | Upload to |
|------|-----------|
| TIA schematic or plot | `assets/img/projects/tia.jpg` |
| PLL schematic or plot | `assets/img/projects/pll.jpg` |
| SRAM schematic or plot | `assets/img/projects/sram.jpg` |
| Power device plot | `assets/img/projects/power-devices.jpg` |
| NeuroSense photo | `assets/img/projects/neurosense.jpg` |
| NeuroBand photo | `assets/img/projects/neuroband.jpg` |
| FPGA quadcopter photo | `assets/img/projects/fpga-drone.jpg` |
| AZO films on the ellipsometer stage | `assets/img/experience/azo-ellipsometer.jpg` |

Schematics and plots are shown whole (not cropped). Photos are cropped to fill the slot. Keep files under about 300 KB; 1600 px wide is plenty.
On github.com: open the folder (create it by typing `assets/img/projects/` in the file name box), click **Add file > Upload files**, then **Commit changes**.

## Add a blog post

1. Copy `_drafts/post-template.md`.
2. Save the copy in the `_posts` folder. Name it `YYYY-MM-DD-short-title.md`, for example `_posts/2026-11-02-azo-ellipsometry-in-wvase.md`.
3. Change the `title` and `description` at the top, then write the post in Markdown.
4. Commit and push. The post shows up on the Blog page in about a minute. The Blog link in the menu appears once the first post exists.

On github.com you can do this in the browser: open the `_posts` folder, click **Add file > Create new file**, type the file name, paste the post, and click **Commit changes**.

Files in `_drafts` are never published.

## Resume

The site has no resume download. Do not upload a resume PDF to this repo: everything here is public, including the phone number on the resume.

## Change text

Edit `content/site-content.md` first so it stays the source of truth. Then make the same change in `index.html`.

## Preview locally (optional)

Needs Ruby. Run `gem install github-pages`, then `jekyll serve` in this folder, and open http://localhost:4000.
