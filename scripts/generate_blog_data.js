const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, '../posts');
const assetsDir = path.join(__dirname, '../assets');
const outputFile = path.join(assetsDir, 'blog_data.js');
const sitemapFile = path.join(__dirname, '../sitemap.xml');
const SITE_URL = 'https://3d-printing-services-delta.vercel.app'; // Update with actual domain if different

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
}

function getMetaContent(content, name) {
    const match = content.match(new RegExp(`<meta name="${name}" content="([^"]*)"`, 'i')) ||
        content.match(new RegExp(`<meta content="([^"]*)" name="${name}"`, 'i'));
    return match ? match[1] : '';
}

function getTitle(content) {
    const match = content.match(/<title>([^<]*)<\/title>/i);
    return match ? match[1] : 'Untitled Post';
}

// Function to extract first image src from content
function getFirstImage(content) {
    const match = content.match(/<img[^>]+src="([^">]+)"/i);
    return match ? match[1] : null;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

try {
    const files = fs.existsSync(postsDir) ? fs.readdirSync(postsDir) : [];

    const posts = files
        .filter(file => file.endsWith('.html'))
        .map(file => {
            const filePath = path.join(postsDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const stats = fs.statSync(filePath);

            // Try to get date from meta tag, fallback to file creation time
            const metaDate = getMetaContent(content, 'date');
            const date = metaDate ? new Date(metaDate) : stats.birthtime;

            return {
                filename: file,
                url: `posts/${file}`,
                title: getTitle(content),
                description: getMetaContent(content, 'description') || 'Read this article to learn more.',
                date: formatDate(date),
                isoDate: date.toISOString(), // For sorting
                tags: ['Trends'], // Could also extract this from meta keywords if available
                image: getFirstImage(content) || 'assets/images/default-blog.jpg' // Ensure path is relative to blog page or absolute
            };
        })
        // Sort by date descending (newest first)
        .sort((a, b) => new Date(b.isoDate) - new Date(a.isoDate));

    // Output as a JavaScript file with a global variable
    const jsContent = `window.blogPosts = ${JSON.stringify(posts, null, 2)};`;

    fs.writeFileSync(outputFile, jsContent);
    console.log(`Successfully generated blog index (JS) with ${posts.length} posts.`);

    // --- Generate Sitemap ---
    const staticPages = [
        'index.html',
        'blog.html'
    ];

    let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages
    staticPages.forEach(page => {
        sitemapContent += `    <url>
        <loc>${SITE_URL}/${page}</loc>
        <changefreq>weekly</changefreq>
        <priority>${page === 'index.html' ? '1.0' : '0.8'}</priority>
    </url>
`;
    });

    // Add blog posts
    posts.forEach(post => {
        sitemapContent += `    <url>
        <loc>${SITE_URL}/${post.url}</loc>
        <lastmod>${post.date}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
`;
    });

    sitemapContent += `</urlset>`;

    fs.writeFileSync(sitemapFile, sitemapContent);
    console.log(`Successfully generated sitemap.xml with ${staticPages.length + posts.length} URLs.`);

} catch (err) {
    console.error('Error generating blog assets:', err);
    process.exit(1);
}
