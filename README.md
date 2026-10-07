# girisharora.com

Personal website of Girish Arora. Plain HTML, CSS, and a little JavaScript. GitHub Pages builds and hosts it.

## Where things are

| What | Where |
|------|-------|
| Source text for the whole site | `content/site-content.md` |
| Original photos | `content/photos/` (not published) |
| Home page | `index.html` |
| Blog list page | `blog.html` |
| Contact page | `contact.html` |
| Header, footer, page shell | `_layouts/base.html` |
| Blog post page design | `_layouts/post.html` |
| Blog posts | `_posts/` |
| Styles | `assets/css/style.css` |
| Scroll animations and photo enlarge | `assets/js/main.js` |
| Hero circuit animation | `assets/js/hero.js` |
| Web-sized photos | `assets/img/` |
| Custom domain | `CNAME` |
| Site settings (email, links, resume path) | `_config.yml` |

## Add a blog post

1. Copy `_drafts/post-template.md`.
2. Save the copy in the `_posts` folder. Name it `YYYY-MM-DD-short-title.md`, for example `_posts/2026-11-02-azo-ellipsometry-in-wvase.md`.
3. Change the `title` and `description` at the top, then write the post in Markdown.
4. Commit and push. The post shows up on the Blog page in about a minute.

On github.com you can do this in the browser: open the `_posts` folder, click **Add file > Create new file**, type the file name, paste the post, and click **Commit changes**.

Files in `_drafts` are never published.

## Add your resume

Upload your resume PDF as `assets/Girish-Arora-Resume.pdf`. The Resume buttons on the home and contact pages appear on their own once the file exists. To use another file name, change `resume_path` in `_config.yml`.

## Change text

Edit `content/site-content.md` first so it stays the source of truth. Then make the same change in `index.html` (home page) or `contact.html`.

## Preview locally (optional)

Needs Ruby. Run `gem install github-pages`, then `jekyll serve` in this folder, and open http://localhost:4000.
