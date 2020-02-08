import { extractMetadata } from '../extractMetadata';

describe('extractMetadata', () => {
  describe('roles', () => {
    it('should return empty roles if html does not contains metadata', () => {
      const html = ``;
      expect(extractMetadata(html, 'a.html')).toMatchObject({
        roles: []
      });
    });

    it('should ignore invalid roles', () => {
      const html = `
      <meta content="admin, hub-admin, invalid" name="roles" />    
    `;
      expect(extractMetadata(html, 'a.html')).toMatchObject({
        roles: ['admin', 'hub-admin']
      });
    });

    it('should return the list of roles', () => {
      const html = `
      <meta content="admin, hub-admin" name="roles" />    
    `;
      expect(extractMetadata(html, 'a.html')).toMatchObject({
        roles: ['admin', 'hub-admin']
      });
    });
  });

  describe('showFooterNavigation', () => {
    it('should return true if is not specified', () => {
      const html = ``;
      expect(extractMetadata(html, 'a.html')).toMatchObject({
        showFooterNavigation: true
      });
    });

    it('should return true if value is invalid', () => {
      const html = `
        <meta content="invalid" name="showFooterNavigation" />      
      `;
      expect(extractMetadata(html, 'a.html')).toMatchObject({
        showFooterNavigation: true
      });
    });

    it('should parse current value', () => {
      const html = `
        <meta content="false" name="showFooterNavigation" />      
      `;
      expect(extractMetadata(html, 'a.html')).toMatchObject({
        showFooterNavigation: false
      });
    });
  });

});
