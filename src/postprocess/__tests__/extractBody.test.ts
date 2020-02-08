import { extractBody } from '../extractBody';

describe('extractBody', () => {
  it('should extract the body of the html', () => {
    const html = `
<html>
<head>
  <meta content="admin, hub-admin, invalid" name="roles" />
</head>
<body>
  <h1>Getting started</h1>
</body>
</html>
    `;
    const result = extractBody(html);
    expect(result).toMatchInlineSnapshot(`
      "
        <h1>Getting started</h1>


          "
    `);
  });
});
