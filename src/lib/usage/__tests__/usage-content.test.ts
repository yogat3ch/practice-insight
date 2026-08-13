import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import prettier from 'prettier';
import sanitizeHtml from 'sanitize-html';
import {
	buildUsageContent,
	renderUsageHtml,
	splitSections,
} from '../../../../scripts/generate-usage.mjs';
import {usageSections} from '../usage-content';

// Test file is at src/lib/usage/__tests__/ — 5 levels up is the repo root.
const ROOT = resolve(__dirname, '../../../..');

function docsMarkdown(): string {
	return readFileSync(resolve(ROOT, 'docs/usage.md'), 'utf8');
}

async function freshGeneratedContent(): Promise<string> {
	const raw = buildUsageContent(docsMarkdown());
	// The generator writes prettier-formatted output (resolving the repo
	// config); mirror that here so the drift guard compares like-for-like.
	const prettierConfig = await prettier.resolveConfig(
		resolve(ROOT, 'src/lib/usage/usage-content.ts'),
	);
	return prettier.format(raw, {...prettierConfig, parser: 'typescript'});
}

describe('usage-content', () => {
	it('is in sync with a fresh generation of docs/usage.md (drift guard)', async () => {
		const generated = await freshGeneratedContent();
		const committed = readFileSync(
			resolve(ROOT, 'src/lib/usage/usage-content.ts'),
			'utf8',
		);
		expect(generated).toBe(committed);
	});

	it('exports non-empty sections with titles and html', () => {
		expect(usageSections.length).toBeGreaterThan(0);
		for (const section of usageSections) {
			expect(section.title.trim().length).toBeGreaterThan(0);
			expect(section.html.trim().length).toBeGreaterThan(0);
		}
	});

	it('produced HTML is well-formed and sanitized', () => {
		const sections = splitSections(renderUsageHtml(docsMarkdown()));
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
				],
				allowedAttributes: {
					a: ['href', 'title'],
					th: ['align'],
					td: ['align'],
				},
			});
			expect(roundTrip).toBe(section.html);

			// No script, iframe, event handlers, or javascript: links leak through.
			expect(section.html).not.toMatch(/<script/i);
			expect(section.html).not.toMatch(/<iframe/i);
			expect(section.html).not.toMatch(/on\w+=/i);
			expect(section.html).not.toMatch(/javascript:/i);
		}
	});

	it('contains the expected canonical sections', () => {
		const titles = usageSections.map(section => section.title);
		expect(titles).toEqual([
			'Getting started',
			'Load your data',
			'Timeline',
			'Comparison',
			'Distribution',
			'Privacy',
			'FAQ / Troubleshooting',
		]);
	});
});
