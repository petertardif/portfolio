import { readFile, writeFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const ROOT = path.resolve(import.meta.dirname, '..');
const POSTS_DIR = path.join(ROOT, 'posts');
const OUT_DIR = path.join(ROOT, '_site');
const OUT_BLOG_DIR = path.join(OUT_DIR, 'blog');

const STATIC_ENTRIES = ['index.html', 'main.css', 'index.js', 'blog.js', 'assets'];

const CATEGORY_CLASS = {
	'Home Projects': 'home',
	Software: 'software',
	Books: 'books',
	Fitness: 'fitness',
	Family: 'family',
};

function slugify(filename) {
	return filename.replace(/\.md$/, '');
}

function computeReadTime(body, override) {
	if (override) return override;
	const words = body.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / 200));
}

function formatDate(dateValue) {
	const date = new Date(dateValue);
	return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

function escapeHtml(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

async function loadPosts() {
	const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith('.md'));
	const posts = await Promise.all(
		files.map(async (file) => {
			const raw = await readFile(path.join(POSTS_DIR, file), 'utf8');
			const { data, content } = matter(raw);
			const slug = data.slug || slugify(file);
			const categoryClass = CATEGORY_CLASS[data.category];
			if (!categoryClass) {
				throw new Error(`Post "${file}" has unknown category "${data.category}"`);
			}
			return {
				slug,
				title: data.title,
				date: data.date,
				category: data.category,
				categoryClass,
				excerpt: data.excerpt,
				readTime: computeReadTime(content, data.readTime),
				content,
			};
		})
	);
	posts.sort((a, b) => new Date(b.date) - new Date(a.date));
	return posts;
}

function renderFeaturedCard(post) {
	return `<a href="blog/${post.slug}.html" class="feature">
			<div class="feature__media media-placeholder">
				<span class="media-placeholder__label">${post.slug} &mdash; image</span>
			</div>
			<div class="feature__body">
				<div class="feature__meta">
					<span class="cat-badge cat-badge--lg cat-badge--${post.categoryClass}">${post.category}</span>
					<span class="feature__meta-note">Latest &middot; ${post.readTime} min read</span>
				</div>
				<h2 class="display feature__title">${post.title}</h2>
				<p class="feature__text">${post.excerpt}</p>
				<span class="feature__read">Read the post <i class="fa-solid fa-arrow-right feature__read-icon"></i></span>
			</div>
		</a>`;
}

function renderPostCard(post) {
	return `<a href="blog/${post.slug}.html" class="post-card" data-category="${post.category}">
				<div class="post-card__media"></div>
				<div class="post-card__body">
					<div class="post-card__meta">
						<span class="cat-badge cat-badge--${post.categoryClass}">${post.category}</span>
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

async function buildPostPages(posts) {
	const template = await readFile(path.join(ROOT, 'templates', 'post.template.html'), 'utf8');
	await mkdir(OUT_BLOG_DIR, { recursive: true });
	for (const post of posts) {
		const html = template
			.replaceAll('{{TITLE}}', escapeHtml(post.title))
			.replaceAll('{{EXCERPT}}', escapeHtml(post.excerpt))
			.replaceAll('{{CATEGORY}}', post.category)
			.replaceAll('{{CATEGORY_CLASS}}', post.categoryClass)
			.replaceAll('{{DATE_DISPLAY}}', formatDate(post.date))
			.replaceAll('{{READ_TIME}}', String(post.readTime))
			.replace('{{CONTENT}}', marked.parse(post.content));
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
