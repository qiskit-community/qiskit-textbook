import { processMathjax } from '../mathjax';

describe('mathjax', () => {
  it('should render matrix correctly', async () => {
    const html = `
<div class="math notranslate nohighlight">
\\[\\begin{split}H =\\\\frac{1}{\\\\sqrt{2}}\\\\begin{pmatrix} 1 &amp; 1 \\\\\\\\ 1 &amp; -1 \\\\end{pmatrix}
.\\end{split}\\]</div>
    `;

    const result = await processMathjax(html);
    expect(result).toMatchSnapshot();
  });
});
