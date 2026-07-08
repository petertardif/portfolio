import { readFile, writeFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const ROOT = path.resolve(import.meta.dirname, '..');
const POSTS_DIR = path.join(ROOT, 'posts');
const OUT_DIR = path.join(ROOT, '_site');
const OUT_BLOG_DIR = path.join(OUT_DIR, 'blog');

const STATIC_ENTRIES = ['index.html', 'main.css', 'index.js', 'blog.js', 'assets', 'images'];

const CATEGORY_CLASS = {
	'Home Projects': 'home',
	Software: 'software',
	Books: 'books',
	Fitness: 'fitness',
	Family: 'family',
	Career: 'career',
};

function slugify(filename) {
	return filename.replace(/\.md$/, '');
}

function categorySlug(category) {
	if (CATEGORY_CLASS[category]) return CATEGORY_CLASS[category];
	return category
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

function computeReadTime(body, override) {
	if (override) return override;
	const words = body.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / 200));
}

function formatDate(dateValue) {
	const date = new Date(dateValue);
	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'UTC',
	}).format(date);
}

function deriveExcerpt(body) {
	const lines = body.split('\n');
	let paragraph = '';
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('>') || trimmed.startsWith('#')) continue;
		paragraph = trimmed;
		break;
	}
	const plain = paragraph
		.replace(/<[^>]+>/g, '')
		.replace(/[*_`]/g, '')
		.replace(/\[(.*?)\]\(.*?\)/g, '$1')
		.trim();
	return plain.length > 160 ? `${plain.slice(0, 157).trimEnd()}…` : plain;
}

function escapeHtml(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

// Frontmatter image paths are authored relative to a post page (_site/blog/<slug>.html),
// e.g. "../images/foo.jpg". Cards render one level up, at _site/blog.html, so strip the "../".
function imagePathFromRoot(relPath) {
	return relPath.replace(/^\.\.\//, '');
}

async function loadPosts() {
	const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith('.md'));
	const posts = await Promise.all(
		files.map(async (file) => {
			const raw = await readFile(path.join(POSTS_DIR, file), 'utf8');
			const { data, content } = matter(raw);
			const slug = data.slug || slugify(file);
			const category = data.category || null;
			return {
				slug,
				title: data.title,
				date: data.date,
				category,
				categorySlug: category ? categorySlug(category) : null,
				excerpt: data.excerpt || deriveExcerpt(content),
				readTime: computeReadTime(content, data.readTime),
				featuredImage: data.featuredImage || null,
				altText: data.altText || data.title,
				secondaryImage: data.secondaryImage || null,
				tags: data.tags || [],
				content,
			};
		})
	);
	posts.sort((a, b) => new Date(b.date) - new Date(a.date));
	return posts;
}

function renderCategoryBadge(post, extraClass = '') {
	if (!post.category) return '';
	return `<span class="cat-badge${extraClass} cat-badge--${post.categorySlug}">${post.category}</span>`;
}

function renderCardMedia(post) {
	if (post.featuredImage) {
		const src = imagePathFromRoot(post.featuredImage);
		return { class: '', html: `<img src="${src}" alt="${escapeHtml(post.altText)}" class="post-card__img" />` };
	}
	return { class: ' media-placeholder', html: `<span class="media-placeholder__label">${post.slug} &mdash; image</span>` };
}

function renderFeaturedCard(post) {
	const media = renderCardMedia(post);
	return `<a href="blog/${post.slug}.html" class="feature"${post.category ? ` data-category="${post.category}"` : ''}>
			<div class="feature__media${media.class}">
				${media.html}
			</div>
			<div class="feature__body">
				<div class="feature__meta">
					${renderCategoryBadge(post, ' cat-badge--lg')}
					<span class="feature__meta-note">Latest &middot; ${post.readTime} min read</span>
				</div>
				<h2 class="display feature__title">${post.title}</h2>
				<p class="feature__text">${post.excerpt}</p>
				<span class="feature__read">Read the post <i class="fa-solid fa-arrow-right feature__read-icon"></i></span>
			</div>
		</a>`;
}

function renderPostCard(post) {
	const media = renderCardMedia(post);
	return `<a href="blog/${post.slug}.html" class="post-card"${post.category ? ` data-category="${post.category}"` : ''}>
				<div class="post-card__media${media.class}">${media.html}</div>
				<div class="post-card__body">
					<div class="post-card__meta">
						${renderCategoryBadge(post)}
						<span class="post-card__time">${post.readTime} min</span>
					</div>
					<h3 class="post-card__title">${post.title}</h3>
					<p class="post-card__text">${post.excerpt}</p>
				</div>
			</a>`;
}

function replaceBetweenMarkers(html, marker, replacement) {
	const pattern = new RegExp(`(<!-- BUILD:${marker} -->)[\\s\\S]*?(<!-- \\/BUILD:${marker} -->)`);
	if (!pattern.test(html)) {
		throw new Error(`Marker BUILD:${marker} not found in blog.html`);
	}
	return html.replace(pattern, `$1\n\t\t${replacement}\n\t\t$2`);
}

async function buildBlogIndex(posts) {
	const [featured, ...rest] = posts;
	const template = await readFile(path.join(ROOT, 'blog.html'), 'utf8');
	let html = replaceBetweenMarkers(template, 'FEATURED', renderFeaturedCard(featured));
	html = replaceBetweenMarkers(html, 'GRID', rest.map(renderPostCard).join('\n\n'));
	await writeFile(path.join(OUT_DIR, 'blog.html'), html);
}

function renderHeroImage(post) {
	if (!post.featuredImage) return '';
	return `<div class="container post-hero">
		<img src="${post.featuredImage}" alt="${escapeHtml(post.altText)}" class="post-hero__img" />
	</div>`;
}

function renderSecondaryImage(post) {
	if (!post.secondaryImage) return '';
	return `<div class="post-secondary-image">
			<img src="${post.secondaryImage}" alt="${escapeHtml(post.title)} &mdash; additional photo" class="post-secondary-image__img" />
		</div>`;
}

function renderTagsBlock(post) {
	if (!post.tags.length) return '';
	const tags = post.tags.map((tag) => `<span class="post-tag">${escapeHtml(tag)}</span>`).join('\n\t\t\t');
	return `<div class="post-tags">
			${tags}
		</div>`;
}

async function buildPostPages(posts) {
	const template = await readFile(path.join(ROOT, 'templates', 'post.template.html'), 'utf8');
	await mkdir(OUT_BLOG_DIR, { recursive: true });
	for (const post of posts) {
		const html = template
			.replaceAll('{{TITLE}}', escapeHtml(post.title))
			.replaceAll('{{EXCERPT}}', escapeHtml(post.excerpt))
			.replaceAll('{{CATEGORY_BADGE}}', renderCategoryBadge(post, ' cat-badge--lg'))
			.replaceAll('{{DATE_DISPLAY}}', formatDate(post.date))
			.replaceAll('{{READ_TIME}}', String(post.readTime))
			.replace('{{HERO_IMAGE}}', renderHeroImage(post))
			.replace('{{CONTENT}}', marked.parse(post.content))
			.replace('{{SECONDARY_IMAGE}}', renderSecondaryImage(post))
			.replace('{{TAGS_BLOCK}}', renderTagsBlock(post));
		await writeFile(path.join(OUT_BLOG_DIR, `${post.slug}.html`), html);
	}
}

async function copyStaticFiles() {
	for (const entry of STATIC_ENTRIES) {
		await cp(path.join(ROOT, entry), path.join(OUT_DIR, entry), { recursive: true });
	}
}

async function main() {
	await rm(OUT_DIR, { recursive: true, force: true });
	await mkdir(OUT_DIR, { recursive: true });

	await copyStaticFiles();
	const posts = await loadPosts();
	await buildPostPages(posts);
	await buildBlogIndex(posts);

	console.log(`Built ${posts.length} post${posts.length === 1 ? '' : 's'} into _site/`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
