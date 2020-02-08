import { extractHeadings } from '../extractHeadings';

describe('extractHeadings', () => {
  it('should extract headings from an html', () => {
    const headings = extractHeadings(`
<h1>
      Overview of Quantum <strong>Gates</strong><a
        class="headerlink"
        href="#overview-of-quantum-gates"
        title="Permalink to this headline"
        >¶</a
      >
    </h1>
    <p>Some content here</p>
    <div class="section" id="h-gate">
      <h2>
        H gate<a
          class="headerlink"
          href="#h-gate"
          title="Permalink to this headline"
          >¶</a
        >
      </h2>
    </div>  
    <p>More content here</p>       
`);

    expect(headings).toEqual([
      {
        level: 1,
        title: 'Overview of Quantum Gates',
        slug: 'overview-of-quantum-gates',
        titleHtml: 'Overview of Quantum <strong>Gates</strong>'
      },
      { level: 2, title: 'H gate', slug: 'h-gate', titleHtml: 'H gate' }
    ]);
  });
});
