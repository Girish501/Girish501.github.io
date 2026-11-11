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
| Lazy YouTube embed | `_includes/yt.html` |
| Blog posts | `_posts/` |
| Styles | `assets/css/style.css` |
| Photo enlarge and video loading | `assets/js/main.js` |
| Web-sized photos | `assets/img/` |
| Custom domain | `CNAME` |
| Site settings (email, links) | `_config.yml` |

## Hero figure: AZO Tauc plots

Add CSV files to `data/azo/`, one per Al ratio, named `tauc_99-1.csv`, `tauc_49-1.csv`, `tauc_29-1.csv`, `tauc_19-1.csv`, `tauc_9-1.csv`. Two columns: photon energy in eV, then (αhν)². A header row is optional; if present, its two titles are used as the axis labels, so include units there (for example `Photon energy (eV)`). As soon as the files exist the hero draws them in order from 99:1 to 9:1, then moves a marker from 3.35 to 3.58 eV labeled +0.23 eV. Until then the hero shows the TIA figure. Ratios listed under `tauc_dashed` in `_config.yml` draw dashed, with the footnote from `tauc_footnote`.

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
