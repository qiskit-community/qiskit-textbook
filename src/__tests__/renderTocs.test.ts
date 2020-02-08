import { renderTocsInHtmlPlaceholders } from '../renderTocsInHtmlPlaceholders';
import { Toc } from '../Page';

describe('renderTocsInHtmlPlaceholders', () => {
  it('should render tocs', () => {
    const html = `
<h1>Toc A</h1>

<!-- toc[0] -->

<h1>Toc B</h1>

<!-- toc[1] -->    
    `;

    const tocs: Toc[] = [
      [
        { level: 1, title: 'toc A 1', href: '1.html' },
        { level: 2, title: 'toc A 1.1', href: '1.2.html' },
        { level: 3, title: 'toc A 1.1.1', href: '1.2.1.html' },
        { level: 2, title: 'toc A 1.2', href: '1.2.html' },
        { level: 1, title: 'toc A 2', href: '2.html' }
      ],
      [
        { level: 1, title: 'toc B 1', href: '1.html' },
        { level: 2, title: 'toc B 1.1', href: '1.2.html' }
      ]
    ];

    const processedHtml = renderTocsInHtmlPlaceholders(html, tocs);

    expect(processedHtml).toMatchInlineSnapshot(`
      "
      <h1>Toc A</h1>

      <ul>
      <li class=\\"toctree-l1\\">
        <a href=\\"1.html\\">toc A 1</a><ul>
      <li class=\\"toctree-l2\\">
        <a href=\\"1.2.html\\">toc A 1.1</a><ul>
      <li class=\\"toctree-l3\\">
        <a href=\\"1.2.1.html\\">toc A 1.1.1</a>
      </li>    
          </ul>
      </li>    
          

      <li class=\\"toctree-l2\\">
        <a href=\\"1.2.html\\">toc A 1.2</a>
      </li>    
          </ul>
      </li>    
          

      <li class=\\"toctree-l1\\">
        <a href=\\"2.html\\">toc A 2</a>
      </li>    
          </ul>

      <h1>Toc B</h1>

      <ul>
      <li class=\\"toctree-l1\\">
        <a href=\\"1.html\\">toc B 1</a><ul>
      <li class=\\"toctree-l2\\">
        <a href=\\"1.2.html\\">toc B 1.1</a>
      </li>    
          </ul>
      </li>    
          </ul>    
          "
    `);
  });
});
