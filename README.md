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
| Animations (SVG files) | `_includes/anim/` |
| Animation styles and timing | `assets/css/anim.css` |
| Web-sized photos | `assets/img/` |
| Custom domain | `CNAME` |
| Site settings (email, links) | `_config.yml` |

## Animations

The hero (ALD cycle), five project cards, and two experience entries use inline SVG animations driven by CSS. Each one plays once when it scrolls into view, then holds its last frame. Visitors who set "reduce motion" see only the last frame. The SVGs live in `_includes/anim/` and the timing is in `assets/css/anim.css`. No JavaScript libraries.

## Videos

YouTube videos are embedded with `_includes/yt.html`. Only the thumbnail loads until a visitor clicks play. To change a video, edit its `id="..."` in `index.html`. To start a video partway through, set `start=` to the number of seconds.

## Fill an image slot

The Cleanroom and Compute-in-Memory cards show photos. Other cards show animations (see below). An image slot still exists for photos you may add later. Upload a JPG to the matching path and the placeholder is replaced on the next build. No HTML edit needed.

| Slot | Upload to |
|------|-----------|

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
