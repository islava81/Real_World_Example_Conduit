/// <reference types="cypress" />

//const { env } = require("process")

describe('Test with backend', () => {
    beforeEach('login to the app', () => {
        cy.server() //This is a retroactive line, "Mocking API Responses" lesson
        cy.route('GET', '**/tags', 'fixture:tags.json') //FIXTURE IS SINGULAR!!!
        cy.loginToApplication()

    })
    it('should log in', () => {
        cy.log('Yaaaaay we logged in! as: ' + Cypress.env('username'))
    })

    it('verify correct request and response from API', () => {

        cy.server() //creating the 'server' so we can simulate API call interception
        cy.route('POST', '**/articles').as('postArticles') //Double-asterisk acts as a "wildcard" and  "as" is to declare a "global variable" and save resposned there
        cy.contains('New Article').click()
        cy.get('[formcontrolname="title"]').type('This is the title')
        cy.get('[formcontrolname="description"]').type('Just a test')
        cy.get('[formcontrolname="body"]').type('Blah Blah Blah')
        cy.contains('Publish Article').click()

        cy.wait('@postArticles') //Always use "wait"!!!
        cy.get('@postArticles').then( backend => {
            console.log(backend)
            expect(backend.status).to.equal(200)
            expect(backend.request.body.article.body).to.equal('Blah Blah Blah')
            expect(backend.response.body.article.description).to.equal('Just a test')
        })

    })

    it('should give tags with routing object', () => {
        cy.get('.tag-list').should('contain', 'cypress')
        .and('contain', 'automation')
        .and('contain', 'testing')

    })

    it('verify global feed likes count', () => {

        cy.route('GET', '**/articles/feed*', '{"articles":[], "articlesCount":0}')
        cy.route('GET', '**/articles*', 'fixture:articles.json')

        cy.contains('Global Feed').click()
        cy.get('app-article-list button').then( listOfbuttons => {
            expect(listOfbuttons[0]).to.contain('1')
            expect(listOfbuttons[1]).to.contain('5')
            
        })
        
        cy.fixture('articles').then( file => {
            const articleLink = file.articles[1].slug
            cy.route('POST', '**/articles/'+articleLink+'/favorite', file)
        })

        cy.get('app-article-list button').eq(1).click()
        .should('contain', '6')
    })

    it('deleting a new article in the Global Feed', () => {

        //const userCredentials = {
        //    "user": {
        //        "email": "vod.kanokers@jake.com",
        //        "password": "test123test"
        //    }
        //}

       // cy.request('POST', 'https://conduit.productionready.io/api/users/login', userCredentials)
      //.its('body').then( body => { //This is to grab certain parameters (in this case, the body) from a response
      
            //const token = body.user.token

            const bodyRequest = {
                "article": {
                    "tagList": [],
                    "title": "Request from API",
                    "description": "API Testing is Easy",
                    "body": "Angular is cool!"
                }
            }
        
            cy.get('@token').then( token => {
       
            cy.request({
               url: Cypress.env('apiURL')+'api/articles/',
               headers: { 'Authorization': 'Token '+token },
               method: 'POST',
               body: bodyRequest
            }).then( response => {
                expect(response.status).to.equal(200)
            })

            cy.contains('Global Feed').click()
            cy.get('[class="article-preview"').first().click()
            cy.wait(10)
            cy.get('.article-actions').contains('Delete Article').click()

            cy.request({
                url: Cypress.env('apiURL')+'api/articles?limit=10&offset=0',
                headers: { 'Authorization': 'Token '+token },
                method: 'GET'
            }).its('body').then( body => {
               // console.log(body) //With this step, we can go to the Console on the browser and retrieve any parameters from the
                //articles list, such as the title, etc. We are now removing this bit so we can assert that, after deleting our newly
                //created article, the title of the top item on the list does not match the title we used in ours
                expect(body.articles[0].title).not.to.equal('Request from API')
                
            })

        })


    })

})