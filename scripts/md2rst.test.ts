import { normalizeImages } from './md2rst';

describe('md2rst', () => {
  describe('normalizeImages', () => {
    it('should preserve correct images', () => {
      const md = `![](images.png)`;
      const result = normalizeImages(md);
      expect(result).toMatchInlineSnapshot(`"![](images.png)"`);
    });

    it('should convert html images to markdown', () => {
      const md = `<img src="images.png">`;
      const result = normalizeImages(md);
      expect(result).toMatchInlineSnapshot(`
        "
        ![](images.png)
        "
      `);
    });

    it('should convert html images to markdown with alt', () => {
      const md = `<img src="images.png">`;
      const result = normalizeImages(md);
      expect(result).toMatchInlineSnapshot(`
        "
        ![](images.png)
        "
      `);
    });

    it('should convert multiple images', () => {
      const md = `
<img src="image1.png"> 
<img src="image2.png">
`;
      const result = normalizeImages(md);
      expect(result).toMatchInlineSnapshot(`
        "

        ![](image1.png)
         

        ![](image2.png)

        "
      `);
    });

    it('should ignore extra arguments', () => {
      const md = `
<img src="image1.png" align="middle"> 
`;
      const result = normalizeImages(md);
      expect(result).toMatchInlineSnapshot(`
        "

        ![](image1.png)
         
        "
      `);
    });
  });
});
