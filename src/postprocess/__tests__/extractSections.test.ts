import { extractSections } from '../extractSections';

describe('extractSections', () => {
  it('should get only text content', () => {
    const html = `
<div class="iqx-documentation">

  <div class="section" id="getting-started">
    <h1>Getting started<a class="headerlink" href="#getting-started" title="Permalink to this headline">¶</a></h1>
    <p>This is the getting started content</p>
    <div class="section" id="what-about-having-an-h2">
      <h2>What about having an h2<a class="headerlink" href="#what-about-having-an-h2"
                                    title="Permalink to this headline">¶</a></h2>
      <p>This is the content of the second heading</p>
    </div>
  </div>


</div> 
    `;

    const text = extractSections(html);
    expect(text).toMatchInlineSnapshot(`
      Array [
        Object {
          "heading": Object {
            "level": 1,
            "slug": "getting-started",
            "title": "Getting started",
            "titleHtml": "Getting started",
          },
          "text": "This is the getting started content",
        },
        Object {
          "heading": Object {
            "level": 2,
            "slug": "what-about-having-an-h2",
            "title": "What about having an h2",
            "titleHtml": "What about having an h2",
          },
          "text": "This is the content of the second heading",
        },
      ]
    `);
  });

  it('should remove toc content', () => {
    const html = `<h1>Getting started  <a
        class="headerlink"
        href="#getting-started"
        title="Permalink to this headline"
        >¶</a></h1>
<p>Open the composer</p>

<div class="toctree-wrapper">
  <ul>
    <li class="toctree-l1">
      <a class="reference internal" href="index.html">Step 1</a>
    </li>
    <li class="toctree-l1">
      <a class="reference internal" href="index.html">Step 2</a>
    </li>
  </ul>
</div>    
    
    `;

    const text = extractSections(html);
    expect(text).toMatchInlineSnapshot(`
      Array [
        Object {
          "heading": Object {
            "level": 1,
            "slug": "getting-started",
            "title": "Getting started",
            "titleHtml": "Getting started",
          },
          "text": "Open the composer",
        },
      ]
    `);
  });

  it('should extract sections if there is a wrapper', () => {
    const html = `
<div>
<div>
    <h1>Getting started <a
        class="headerlink"
        href="#getting-started"
        title="Permalink to this headline"
        >¶</a></h1>
    <p>Open the composer. You can use the navbar menu.</p>
</div>
</div>        
    `;

    const text = extractSections(html);
    expect(text).toMatchInlineSnapshot(`
      Array [
        Object {
          "heading": Object {
            "level": 1,
            "slug": "getting-started",
            "title": "Getting started",
            "titleHtml": "Getting started",
          },
          "text": "Open the composer. You can use the navbar menu.",
        },
      ]
    `);
  });

  it('should remove pre blocks', () => {
    const html = `
<div>
<div>
    <h1>Getting started <a
        class="headerlink"
        href="#getting-started"
        title="Permalink to this headline"
        >¶</a></h1>
    <p>Open the composer. You can use the navbar menu.</p>
    <pre>This should be removed</pre>    
</div>
</div>        
    `;

    const text = extractSections(html);
    expect(text).toMatchInlineSnapshot(`
      Array [
        Object {
          "heading": Object {
            "level": 1,
            "slug": "getting-started",
            "title": "Getting started",
            "titleHtml": "Getting started",
          },
          "text": "Open the composer. You can use the navbar menu.",
        },
      ]
    `);
  });
});
