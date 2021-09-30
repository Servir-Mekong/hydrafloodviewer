describe('Menu', () => {
  before(() => {
    cy.visit('/mapviewer/');
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/mapviewer/');
    });
  });

  it('can be closed', () => {
    cy.get('#side-panel').should('be.visible');
    cy.get('#toggle-nav').click();
    cy.get('#side-panel').should('not.be.visible');
  });

  it('can be opened', () => {
    cy.get('#side-panel').should('not.be.visible');
    cy.get('#toggle-nav').click();
    cy.get('#side-panel').should('be.visible');
  });

  it('opens date selection', () => {
    cy.get('#side-panel').as('sidePanel');
    cy.get('@sidePanel').contains('DATE SELECTION').click();
    cy.get('@sidePanel').contains('Select Date (YYYY-MM-DD)').should('be.visible');
  });

  it('changes the data via date selector', () => {
    cy.get('#date_selection').click();
    cy.get('.datepicker').should('be.visible');
    cy.get('.year').eq(1).click(); // selects year 2020
    cy.get('.month').eq(4).click(); // selects May
    cy.get('.day').eq(20).click(); // selects 16
    cy.get('#date_selection').should('have.value', '2020-05-16');
  });

  it('closes date selection', () => {
    cy.get('#side-panel').as('sidePanel');
    cy.get('@sidePanel').contains('DATE SELECTION').click();
    cy.get('@sidePanel').contains('Select Date (YYYY-MM-DD)').should('not.be.visible');
  });
});