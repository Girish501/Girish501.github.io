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
| Hero figure (TIA gain curve) | `_includes/fig-tia.svg` |
| Lazy YouTube embed | `_includes/yt.html` |
| Blog posts | `_posts/` |
| Styles | `assets/css/style.css` |
| Photo enlarge and video loading | `assets/js/main.js` |
| Web-sized photos | `assets/img/` |
| Custom domain | `CNAME` |
| Site settings (email, links) | `_config.yml` |

## Design

Paper background, near-black text, one blue accent for links and buttons. Instrument Serif for the statement and headings, Instrument Sans for everything else (loaded from Google Fonts). Body text is 17 px; nothing is under 13 px. The only animation is the hero entrance on load; nothing moves on scroll. Hover gives quick feedback: underlines draw, buttons step, photos zoom 3%.

## Photos

Square crops for the About grid are `assets/img/photo-*.jpg` (900 px), each with a `-full` version for the enlarged view. To swap a photo, replace both files and keep the names.

## Videos

YouTube videos are embedded with `_includes/yt.html`. Only the thumbnail loads until a visitor clicks play. To change a video, edit its `id="..."` in `index.html`. To start a video partway through, set `start=` to the number of seconds.

## Add a blog post

1. Copy `_drafts/post-template.md`.
2. Save the copy in the `_posts` folder. Name it `YYYY-MM-DD-short-title.md`, for example `_posts/2026-11-02-azo-ellipsometry-in-wvase.md`.
3. Change the `title` and `description` at the top, then write the post in Markdown.
4. Commit and push to `main`. The post shows up on the Writing page in about a minute. The Writing link in the menu appears once the first post exists, and the three latest posts also show under Elsewhere on the home page.

On github.com you can do this in the browser: open the `_posts` folder, click **Add file > Create new file**, type the file name, paste the post, and click **Commit changes**.

Files in `_drafts` are never published.

## Resume

The site has no resume download. Do not upload a resume PDF to this repo: everything here is public, including the phone number on the resume.

## Change text

Edit `content/site-content.md` first so it stays the source of truth. Then make the same change in `index.html`.

## Preview locally (optional)

Needs Ruby. Run `gem install github-pages`, then `jekyll serve` in this folder, and open http://localhost:4000.
