describe('Language', () => {
  before(() => {
    cy.visit('/mapviewer/');
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/mapviewer/');
    });
  });

  it('can be changed to Burmese', () => {
    cy.contains('Language').click();
    cy.contains('Burmese').click();

    cy.contains('ဘာသာစကား').should('exist');
  });

  it('can be changed to English', () => {
    cy.contains('ဘာသာစကား').click();
    cy.contains('အင်္ဂလိပ်').click();

    cy.contains('Language').should('exist');
  });
});
  