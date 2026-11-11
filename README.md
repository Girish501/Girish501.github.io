# girisharora.com

Personal website of Girish Arora. Plain HTML, CSS, and a little JavaScript. GitHub Pages builds and hosts it from the `main` branch.

## Where things are

| What | Where |
|------|-------|
| Source text for the whole site | `content/site-content.md` |
| Original photos | `content/photos/` (not published) |
| Home page (all sections, including Contact) | `index.html` |
| Writing list page | `blog.html` |
| Header, page shell, fonts | `_layouts/base.html` |
| Post page design | `_layouts/post.html` |
| Hero figure (Tauc plots from `data/azo/*.csv`, else the TIA curve) | `_includes/fig-tauc.html`, `assets/js/tauc.js`, `_includes/fig-tia.svg` |
| ALD supercycle figure (Process work) | `_includes/fig-ald.html`, `assets/js/ald.js` |
| Hero point cloud (three.js) | `assets/js/cloud.js` |
| Pinned stage around the AZO case study | `assets/js/stage.js` |
| Scroll-linked motion (rise, count, settle, draw) | `assets/js/anim.js` |
| Lazy YouTube embed | `_includes/yt.html` |
| Blog posts | `_posts/` |
| Styles | `assets/css/style.css` |
| Photo enlarge and video loading | `assets/js/main.js` |
| Web-sized photos | `assets/img/` |
| Custom domain | `CNAME` |
| Site settings (email, links) | `_config.yml` |

## Hero figure: AZO Tauc plots

Add CSV files to `data/azo/`, one per Al ratio, named `tauc_99-1.csv`, `tauc_49-1.csv`, `tauc_29-1.csv`, `tauc_19-1.csv`, `tauc_9-1.csv`. Two columns: photon energy in eV, then (αhν)². A header row is optional; if present, its two titles are used as the axis labels, so include units there (for example `Photon energy (eV)`). As soon as the files exist the hero draws them in order from 99:1 to 9:1, then moves a marker from 3.35 to 3.58 eV labeled +0.23 eV. Until then the hero shows the TIA figure. Ratios listed under `tauc_dashed` in `_config.yml` draw dashed, with the footnote from `tauc_footnote`.

## Hero point cloud

On desktop (at least 1024 x 700, no reduced motion, a hardware GPU) the hero pins and a cloud of about 42,000 points morphs through shapes built from the site's numbers as you scroll: the wurtzite ZnO unit cell as a ball-and-stick model (hexagonal prism, Zn and O with their bonds, dimension marks for a = 3.252 Å and c = 5.213 Å), the 600-cycle film in cross-section on its substrate (a blue plane per Al cycle at 19:1, a thickness bracket, labels for the film, an Al cycle and the substrate), the fitted diode and MOSFET I-V lines, and the TIA gain curve. Once `data/azo/tauc_*.csv` exist the Tauc curves join as a shape. A panel shows each shape's headline number, counting as it comes into focus. three.js (one library, from cdn.jsdelivr.net) draws the points; the scroll scrub is the site's own. Everywhere else the hero keeps its static figure. The numbers are at the top of `assets/js/cloud.js`; the panel text and the small labels (`.cloud-tag`, moved each frame to a point in their shape) are in `index.html`.

## Scroll-linked motion

Elements marked `data-anim` respond to their position in the viewport as you scroll, forward on the way in and back on the way out: headings and rows rise 12 px and fade in, lead numbers count up, photos settle from a 4% zoom, the static TIA curve draws. Values follow apple.com's product pages. Under reduced motion nothing moves. See the top of `assets/js/anim.js` for the attributes.

## Pinned stage

On wide, tall screens (1024 px wide and 860 px tall or more) the AZO case study pins for about three screens of scroll. The ALD figure follows the scroll position and the three text steps (What and why, Process, Results) swap in turn. On smaller screens and under reduced motion nothing pins and the content stacks. Thresholds are at the top of `assets/js/stage.js`.

## ALD supercycle figure

The Process work section has an animated figure of the ALD recipe: one cycle's valve sequence on the left, the film growing on the substrate on the right with a blue line at every Al cycle. The ratio buttons change the cadence. It plays once when scrolled into view; Replay restarts it. The recipe numbers (ratios, 600 cycles, 200 °C) are in `_includes/fig-ald.html` and the top of `assets/js/ald.js`.

## Design

Paper background, near-black text, one blue accent for links and buttons. Instrument Sans for everything (loaded from Google Fonts), headings at weight 600, tabular numerals throughout. Body text is 17 px; nothing is under 13 px. The only animation is the hero entrance on load; nothing moves on scroll. Hover gives quick feedback: underlines draw, buttons step, photos zoom 3%.

## Photos

Square crops for the About grid are `assets/img/photo-*.jpg` (900 px), each with a `-full` version for the enlarged view. To swap a photo, replace both files and keep the names.

## Videos

YouTube videos are embedded with `_includes/yt.html`. Only the thumbnail loads until a visitor clicks play. Poster frames are local files in `assets/img/video-*.jpg`. To change a video, edit its `id="..."` and poster in `index.html`. To start a video partway through, set `start=` to the number of seconds.

## Add a blog post

1. Copy `_drafts/post-template.md`.
2. Save the copy in the `_posts` folder. Name it `YYYY-MM-DD-short-title.md`, for example `_posts/2026-11-02-azo-ellipsometry-in-wvase.md`.
3. Change the `title` and `description` at the top, then write the post in Markdown.
4. Commit and push to `main`. The post shows up on the Writing page in about a minute. The Writing link in the menu appears once the first post exists. Also remove the `sitemap: false` line at the top of `blog.html` so search engines can list the page.

On github.com you can do this in the browser: open the `_posts` folder, click **Add file > Create new file**, type the file name, paste the post, and click **Commit changes**.

Files in `_drafts` are never published.

## Resume

The site has no resume download. Do not upload a resume PDF to this repo: everything here is public, including the phone number on the resume.

## Change text

Edit `content/site-content.md` first so it stays the source of truth. Then make the same change in `index.html`.

## Preview locally (optional)

Needs Ruby. Run `gem install github-pages`, then `jekyll serve` in this folder, and open http://localhost:4000.
