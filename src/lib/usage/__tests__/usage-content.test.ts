import {readFileSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import prettier from 'prettier';
import sanitizeHtml from 'sanitize-html';
import {describe, expect, it} from 'vitest';
import {
	buildUsageContent,
	renderUsageHtml,
	splitSections,
} from '../../../../scripts/generate-usage.mjs';
import {usageDocuments, usageSections} from '../usage-content';

// Test file is at src/lib/usage/__tests__/ — 5 levels up is the repo root.
const ROOT = resolve(__dirname, '../../../..');

function docsMarkdown(docId: string): string {
	const startMarker = `<!-- app-${docId}:start -->`;
	const dir = resolve(ROOT, 'docs');
	const file = readdirSync(dir).find(f => {
		if (!f.endsWith('.md')) return false;
		return readFileSync(resolve(dir, f), 'utf8').includes(startMarker);
	});
	if (!file) throw new Error(`No docs/ file found for doc "${docId}".`);
	return readFileSync(resolve(dir, file), 'utf8');
}

async function freshGeneratedContent(): Promise<string> {
	const raw = buildUsageContent();
	// The generator writes prettier-formatted output (resolving the repo
	// config); mirror that here so the drift guard compares like-for-like.
	const prettierConfig = await prettier.resolveConfig(
		resolve(ROOT, 'src/lib/usage/usage-content.ts'),
	);
	return prettier.format(raw, {...prettierConfig, parser: 'typescript'});
}

describe('usage-content', () => {
	it('is in sync with a fresh generation of docs/*.md (drift guard)', async () => {
		const generated = await freshGeneratedContent();
		const committed = readFileSync(
			resolve(ROOT, 'src/lib/usage/usage-content.ts'),
			'utf8',
		);
		expect(generated).toBe(committed);
	});

	it('exports multiple documents with non-empty sections', () => {
		expect(usageDocuments.length).toBeGreaterThan(0);
		for (const doc of usageDocuments) {
			expect(doc.id.trim().length).toBeGreaterThan(0);
			expect(doc.title.trim().length).toBeGreaterThan(0);
			expect(doc.sections.length).toBeGreaterThan(0);
			for (const section of doc.sections) {
				expect(section.title.trim().length).toBeGreaterThan(0);
				expect(section.html.trim().length).toBeGreaterThan(0);
			}
		}
		// Flat list should combine all doc sections in order.
		expect(usageSections.length).toBe(
			usageDocuments.reduce((sum, doc) => sum + doc.sections.length, 0),
		);
	});

	it('produced HTML is well-formed and sanitized', () => {
		for (const doc of usageDocuments) {
			const sections = splitSections(
				renderUsageHtml(docsMarkdown(doc.id), doc.id),
			);
			for (const section of sections) {
				// Re-sanitizing the committed HTML must be a no-op (already clean).
				const roundTrip = sanitizeHtml(section.html, {
					allowedTags: [
						'h1',
						'h2',
						'h3',
						'p',
						'a',
						'ul',
						'ol',
						'li',
						'strong',
						'em',
						'code',
						'pre',
						'blockquote',
						'table',
						'thead',
						'tbody',
						'tr',
						'th',
						'td',
						'br',
						'hr',
						'img',
					],
					allowedAttributes: {
						a: ['href', 'title'],
						th: ['align'],
						td: ['align'],
						img: ['src', 'alt', 'title', 'width', 'height'],
					},
				});
				expect(roundTrip).toBe(section.html);

				// No script, iframe, event handlers, or javascript: links leak through.
				expect(section.html).not.toMatch(/<script/i);
				expect(section.html).not.toMatch(/<iframe/i);
				expect(section.html).not.toMatch(/on\w+=/i);
				expect(section.html).not.toMatch(/javascript:/i);
			}
		}
	});

	it('rewrites static/ image srcs to root-relative for in-app use', () => {
		const md =
			'# Test\n\n<!-- app-test:start -->\n\n## Section\n\n![Export menu](static/it_export/three_lines.png)\n\n<!-- app-test:end -->\n';
		const html = renderUsageHtml(md, 'test');
		expect(html).toContain('src="/it_export/three_lines.png"');
		expect(html).not.toContain('src="static/');
	});

	it('rewrites relative .md links to in-app doc hashes', () => {
		const md =
			'# Test\n\n<!-- app-test:start -->\n\n## Section\n\nSee the [Usage Guide](usage.md), the [Export guide](it_export.md), and the [issues page](https://github.com/yogat3ch/practice-insight/issues).\n\n<!-- app-test:end -->\n';
		const html = renderUsageHtml(md, 'test');
		expect(html).toContain('href="#/usage"');
		expect(html).toContain('href="#/it-export"');
		// External/absolute links are left untouched.
		expect(html).toContain(
			'href="https://github.com/yogat3ch/practice-insight/issues"',
		);
	});

	it('contains the expected canonical documents', () => {
		const ids = usageDocuments.map(doc => doc.id);
		expect(ids).toEqual(['it-export', 'usage']);
	});
});
