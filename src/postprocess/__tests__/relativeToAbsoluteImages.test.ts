import { relativeToAbsoluteImages } from '../relativeToAbsoluteImages';

describe('relativeToAbsoluteImages', () => {
  it('should convert relative to absolute image links', () => {
    const html = `
<img src="relative.png"/>
<img src="/relative2.png"/>
<img src="http://external.com/img.png"/>
    `;
    const baseUrl = `http://test.com`;
    const filePath = `qiskit/getting-started/index.rst`;
    const result = relativeToAbsoluteImages(html, filePath, baseUrl);

    expect(result).toMatchInlineSnapshot(`
      "<img src=\\"http://test.com/qiskit/getting-started/relative.png\\">
      <img src=\\"http://test.com/relative2.png\\">
      <img src=\\"http://external.com/img.png\\">
          "
    `);
  });

});
