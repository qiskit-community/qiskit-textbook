import { extractTocs } from '../extractTocs';

describe('extractTocs', () => {
  it('should extract tocs', () => {
    const html = `
<p>Before</p>

<div class="toctree-wrapper compound">
  <ul>
    <li class="toctree-l1">
      <a class="reference internal" href="index.html">Getting started</a>
    </li>
    <li class="toctree-l1">
      <a class="reference internal" href="tool-documentation/index.html"
        >Tool documentation</a
      >
      <ul>
        <li class="toctree-l2">
          <a
            class="reference internal"
            href="tool-documentation/common_tasks.html"
            >Common Tasks</a
          >
          <ul>
            <li class="toctree-l3">
              <a
                class="reference internal"
                href="tool-documentation/common_tasks.html#make-a-system-reservation"
                >Make a system reservation</a
              >
            </li>
          </ul>
        </li>
      </ul>
    </li>
  </ul>
</div>

<p>Middle</p>

<div class="toctree-wrapper compound">
  <ul>
    <li class="toctree-l1">
      <a class="reference internal" href="index.html">Getting started</a>
    </li>
  </ul>
</div>

<p>After</p>
`;
    const tocs = extractTocs(html);

    expect(tocs).toMatchInlineSnapshot(`
      Object {
        "html": "<p>Before</p>

      <!-- toc[0] -->

      <p>Middle</p>

      <!-- toc[1] -->

      <p>After</p>
      ",
        "tocs": Array [
          Array [
            Object {
              "href": "index.html",
              "level": 1,
              "title": "Getting started",
            },
            Object {
              "href": "tool-documentation/index.html",
              "level": 1,
              "title": "Tool documentation",
            },
            Object {
              "href": "tool-documentation/common_tasks.html",
              "level": 2,
              "title": "Common Tasks",
            },
            Object {
              "href": "tool-documentation/common_tasks.html#make-a-system-reservation",
              "level": 3,
              "title": "Make a system reservation",
            },
          ],
          Array [
            Object {
              "href": "index.html",
              "level": 1,
              "title": "Getting started",
            },
          ],
        ],
      }
    `);
  });
});
