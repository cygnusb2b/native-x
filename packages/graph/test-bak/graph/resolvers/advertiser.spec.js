require('../../connections');
const { CursorType } = require('@limit0/graphql-custom-types');
const { graphql, setup, teardown } = require('./utils');
const AdvertiserRepo = require('../../../src/repositories/advertiser');
const ContactRepo = require('../../../src/repositories/contact');

const createAdvertiser = async () => {
  const results = await AdvertiserRepo.seed();
  return results.one();
};

const createContact = async () => {
  const results = await ContactRepo.seed();
  return results.one();
};

const createAdvertisers = async (count) => {
  const results = await AdvertiserRepo.seed({ count });
  return results.all();
};

describe('graph/resolvers/advertiser', function() {
  before(async function() {
    await setup();
    await AdvertiserRepo.remove();
  });
  after(async function() {
    await teardown();
    await AdvertiserRepo.remove();
  });

  describe('Query', function() {

    describe('advertiser', function() {
      let advertiser;
      before(async function() {
        advertiser = await createAdvertiser();
      });

      const query = `
        query Advertiser($input: ModelIdInput!) {
          advertiser(input: $input) {
            id
            name
            logo {
              id
              src
            }
            createdAt
            updatedAt
            campaigns {
              id
            }
            campaignCount
          }
        }
      `;
      it('should reject when no user is logged-in.', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'advertiser', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject if no record was found.', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'advertiser', loggedIn: true })).to.be.rejectedWith(Error, `No advertiser record found for ID ${id}.`);
      });
      it('should return the requested advertiser.', async function() {
        const id = advertiser.id;
        const input = { id };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'advertiser', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id', id);
        const data = await promise;
        expect(data).to.have.all.keys('id', 'name', 'logo', 'createdAt', 'updatedAt', 'campaigns', 'campaignCount');
      });
    });

    describe('allAdvertisers', function() {
      let advertisers;
      before(async function() {
        await AdvertiserRepo.remove();
        advertisers = await createAdvertisers(10);
      });
      after(async function() {
        await AdvertiserRepo.remove();
      });
      const query = `
        query AllAdvertisers($pagination: PaginationInput, $sort: AdvertiserSortInput) {
          allAdvertisers(pagination: $pagination, sort: $sort) {
            totalCount
            edges {
              node {
                id
                name
              }
              cursor
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;
      it('should reject when no user is logged-in.', async function() {
        await expect(graphql({ query, key: 'allAdvertisers', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should return five advertisers out of ten.', async function() {
        const pagination = { first: 5 };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allAdvertisers', variables, loggedIn: true });
        await expect(promise).to.eventually.be.an('object');
        const data = await promise;
        expect(data.totalCount).to.equal(10);
        expect(data.edges.length).to.equal(5);
        expect(data.pageInfo.hasNextPage).to.be.true;
        expect(data.pageInfo.endCursor).to.be.a('string');

        const last = data.edges.pop();
        expect(data.pageInfo.endCursor).to.equal(last.cursor);
      });
      it('should should not have a next page when limited by more than the total.', async function() {
        const pagination = { first: 50 };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allAdvertisers', variables, loggedIn: true });
        await expect(promise).to.eventually.be.an('object');
        const data = await promise;
        expect(data.totalCount).to.equal(10);
        expect(data.edges.length).to.equal(10);
        expect(data.pageInfo.hasNextPage).to.be.false;
      });
      it('should return an error when an after cursor is requested that does not exist.', async function() {
        const { id } = AdvertiserRepo.generate().one();
        const after = CursorType.serialize(id);
        const pagination = { first: 5, after };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allAdvertisers', variables, loggedIn: true });
        await expect(promise).to.be.rejectedWith(Error, `No record found for ID '${id}'`);
      });
    });

    // describe('searchAdvertisers', function() {
    //   let advertisers, model;
    //   before(async function() {
    //     await AdvertiserRepo.remove();
    //     advertisers = await createAdvertisers(10);
    //     model = advertisers[0];
    //   });
    //   after(async function() {
    //     await AdvertiserRepo.remove();
    //   });

    //   const field = 'name';
    //   const query = `
    //     query SearchAdvertisers($pagination: PaginationInput, $search: AdvertiserSearchInput!) {
    //       searchAdvertisers(pagination: $pagination, search: $search) {
    //         totalCount
    //         edges {
    //           node {
    //             id
    //             name
    //           }
    //           cursor
    //         }
    //         pageInfo {
    //           hasNextPage
    //           endCursor
    //         }
    //       }
    //     }
    //   `;
    //   it('should reject when no user is logged-in.', async function() {
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { field, term: 'John' }}
    //     const variables = { pagination, search };
    //     await expect(graphql({ query, variables, key: 'searchAdvertisers', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
    //   });
    //   it('should return at most 5 results.', async function() {
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { field, term: 'John' }}
    //     const variables = { pagination, search };
    //     const promise = graphql({ query, key: 'searchAdvertisers', variables, loggedIn: true });
    //     await expect(promise).to.eventually.be.an('object');
    //     const data = await promise;
    //     expect(data.totalCount).to.be.at.most(10);
    //     expect(data.edges.length).to.be.at.most(5);
    //   });
    //   it('should return an error when an after cursor is requested that does not exist.', async function() {
    //     const after = CursorType.serialize(AdvertiserRepo.generate().one().id);
    //     const pagination = { first: 5, after };
    //     const search = { typeahead: { field, term: 'John' }}
    //     const variables = { pagination, search };
    //     const promise = graphql({ query, key: 'searchAdvertisers', variables, loggedIn: true });
    //     await expect(promise).to.be.rejectedWith(Error, `No record found for cursor '${after}'.`);
    //   });

    //   it('should reject if field is not specified.', async function() {
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { term: 'John' }}
    //     const variables = { pagination, search };
    //     await expect(graphql({ query, variables, key: 'searchAdvertisers', loggedIn: true })).to.be.rejectedWith(Error, /Field value\.typeahead\.field of required type AdvertiserTypeAheadField! was not provided/i);
    //   });
    //   it('should always return an array', async function() {
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { field, term: 'this should never be found unless someone is dumb' }}
    //     const variables = { pagination, search };
    //     const promise = graphql({ query, variables, key: 'searchAdvertisers', loggedIn: true })
    //     const data = await expect(promise).to.eventually.be.an('object');
    //     expect(data.edges).to.be.an('array')
    //   });
    //   it('should return the expected model', async function() {
    //     const { id, name } = model;
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { field, term: name }}
    //     const variables = { pagination, search };
    //     const promise = graphql({ query, variables, key: 'searchAdvertisers', loggedIn: true })
    //     const data = await expect(promise).to.eventually.be.an('object');
    //     expect(data.edges).to.be.an('array')
    //     expect(data.edges[0].node).to.deep.include({ id, name });
    //   });
    //   it('should allow partial searches', async function() {
    //     const { id, name } = model;
    //     const term = name.substr(0, 3);
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { field, term }}
    //     const variables = { pagination, search };
    //     const promise = graphql({ query, variables, key: 'searchAdvertisers', loggedIn: true })
    //     const data = await expect(promise).to.eventually.be.an('object');
    //     expect(data.edges).to.be.an('array')
    //     expect(data.edges[0].node).to.deep.include({ id, name });
    //   });
    //   it('should allow case-insensitive searches', async function() {
    //     const { id, name } = model;
    //     const term = name.toUpperCase();
    //     const pagination = { first: 5 };
    //     const search = { typeahead: { field, term }}
    //     const variables = { pagination, search };
    //     const promise = graphql({ query, variables, key: 'searchAdvertisers', loggedIn: true })
    //     const data = await expect(promise).to.eventually.be.an('object');
    //     expect(data.edges).to.be.an('array')
    //     expect(data.edges[0].node).to.deep.include({ id, name });
    //   });
    // });

  });

  describe('Mutation', function() {

    describe('createAdvertiser', function() {
      const query = `
        mutation CreateAdvertiser($input: CreateAdvertiserInput!) {
          createAdvertiser(input: $input) {
            id
            name
            logo {
              id
              src
            }
            createdAt
            updatedAt
            campaigns {
              id
            }
            campaignCount
          }
        }
      `;
      const payload = {
        name: 'Test Advertiser',
      };

      it('should reject when no user is logged-in.', async function() {
        const input = { payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'createAdvertiser', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should create the advertiser.', async function() {
        const input = { payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'createAdvertiser', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id');
        const data = await promise;
        await expect(AdvertiserRepo.findById(data.id)).to.eventually.be.an('object');
      });
    });

    describe('updateAdvertiser', function() {
      let advertiser;
      before(async function() {
        advertiser = await createAdvertiser();
      });

      const query = `
        mutation UpdateAdvertiser($input: UpdateAdvertiserInput!) {
          updateAdvertiser(input: $input) {
            id
            name
            logo {
              id
              src
            }
            createdAt
            updatedAt
            campaigns {
              id
            }
            notify {
              internal {
                name
                email
              }
              external {
                name
                email
              }
            }
          }
        }
      `;
      const payload = {
        name: 'Updated Advertiser Name',
      };

      it('should reject when no user is logged-in.', async function() {
        const id = '507f1f77bcf86cd799439011'
        const input = { id, payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'updateAdvertiser', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject when the advertiser record is not found.', async function() {
        const id = '507f1f77bcf86cd799439011'
        const input = { id, payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'updateAdvertiser', loggedIn: true })).to.be.rejectedWith(Error, `Unable to update advertiser: no record was found for ID '${id}'`);
      });
      it('should update the advertiser.', async function() {
        const id = advertiser.id;
        const input = { id, payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'updateAdvertiser', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id');
        const data = await promise;
        expect(data.name).to.equal(payload.name);
        await expect(AdvertiserRepo.findById(data.id)).to.eventually.be.an('object').with.property('name', payload.name);
      });
    });

    describe('addContact', function() {
      let advertiser;
      let contact;
      before(async function() {
        advertiser = await createAdvertiser();
        contact = await createContact();
      });
      const type = 'internal';
      const query = `
        mutation AddAdvertiserContact($input: AddContactInput!) {
          addAdvertiserContact(input: $input) {
            id
          }
        }
      `;

      it('should reject when no user is logged-in', async function() {
        const id = advertiser.id;
        const contactId = contact.id;
        const input = { id, type, contactId };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'addAdvertiserContact', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject when the advertiser record is not found', async function() {
        const id = '507f1f77bcf86cd799439011'
        const contactId = contact.id;
        const input = { id, type, contactId };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'addAdvertiserContact', loggedIn: true })).to.be.rejectedWith(Error, /no record was found/i);
      });
      it('should reject when the contact record is not found', async function() {
        const id = advertiser.id;
        const contactId = '507f1f77bcf86cd799439011'
        const input = { id, type, contactId };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'addAdvertiserContact', loggedIn: true })).to.be.rejectedWith(Error, /no contact found/i);
      });

      it('should not reject when the contact is already added', async function() {
        const id = advertiser.id;
        const contactId = contact.id;
        const input = { id, type, contactId };
        const variables = { input };
        await graphql({ query, variables, key: 'addAdvertiserContact', loggedIn: true });
        const res = await graphql({ query, variables, key: 'addAdvertiserContact', loggedIn: true });
        expect(res).to.be.an('object');
      });

      it('should add the contact to the advertiser', async function() {
        const id = advertiser.id;
        const contactId = contact.id;
        const input = { id, type, contactId };
        const variables = { input };
        const res = await graphql({ query, variables, key: 'addAdvertiserContact', loggedIn: true });
        expect(res).to.be.an('object');
      });
    });

    describe('removeContact', function() {
      let advertiser;
      let contact;
      before(async function() {
        advertiser = await createAdvertiser();
        contact = await createContact();
      });
      const type = 'internal';
      const query = `
        mutation RemoveAdvertiserContact($input: RemoveContactInput!) {
          removeAdvertiserContact(input: $input) {
            id
          }
        }
      `;

      it('should reject when no user is logged-in', async function() {
        const id = advertiser.id;
        const contactId = contact.id;
        const input = { id, type, contactId };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'removeAdvertiserContact', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject when the advertiser record is not found', async function() {
        const id = '507f1f77bcf86cd799439011'
        const contactId = contact.id;
        const input = { id, type, contactId };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'removeAdvertiserContact', loggedIn: true })).to.be.rejectedWith(Error, /no record was found/i);
      });
      it('should not reject when the contact record is not found', async function() {
        const id = advertiser.id;
        const contactId = '507f1f77bcf86cd799439011'
        const input = { id, type, contactId };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'removeAdvertiserContact', loggedIn: true })).to.not.be.rejectedWith(Error, /./i);
      });
      it('should not reject when the contact is already removed', async function() {
        const id = advertiser.id;
        const contactId = contact.id;
        const input = { id, type, contactId };
        const variables = { input };
        await graphql({ query, variables, key: 'removeAdvertiserContact', loggedIn: true });
        const res = await graphql({ query, variables, key: 'removeAdvertiserContact', loggedIn: true });
        expect(res).to.be.an('object');
      });
      it('should remove the contact from the advertiser', async function() {
        const id = advertiser.id;
        const contactId = contact.id;
        const input = { id, type, contactId };
        const variables = { input };
        const res = await graphql({ query, variables, key: 'removeAdvertiserContact', loggedIn: true });
        expect(res).to.be.an('object');
      });
    });


    describe('setContacts', function() {
      let advertiser;
      let contact;
      let contactIds;
      before(async function() {
        advertiser = await createAdvertiser();
        contact = await createContact();
        contactIds = [ contact.id ];
      });
      const type = 'internal';
      const query = `
        mutation SetAdvertiserContacts($input: SetContactsInput!) {
          setAdvertiserContacts(input: $input) {
            id
          }
        }
      `;

      it('should reject when no user is logged-in', async function() {
        const id = advertiser.id;
        const input = { id, type, contactIds };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'setAdvertiserContacts', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject when the advertiser record is not found', async function() {
        const id = '507f1f77bcf86cd799439011'
        const input = { id, type, contactIds };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'setAdvertiserContacts', loggedIn: true })).to.be.rejectedWith(Error, /no record was found/i);
      });
      it('should reject when the contact record is not found', async function() {
        const id = advertiser.id;
        const cids = [ '507f1f77bcf86cd799439011' ];
        const input = { id, type, contactIds: cids };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'setAdvertiserContacts', loggedIn: true })).to.be.rejectedWith(Error, /no contact found/i);
      });

      it('should not reject when the contact is already added', async function() {
        const id = advertiser.id;
        const input = { id, type, contactIds };
        const variables = { input };
        await graphql({ query, variables, key: 'setAdvertiserContacts', loggedIn: true });
        const res = await graphql({ query, variables, key: 'setAdvertiserContacts', loggedIn: true });
        expect(res).to.be.an('object');
      });

      it('should add the contact to the advertiser', async function() {
        const id = advertiser.id;
        const input = { id, type, contactIds };
        const variables = { input };
        const res = await graphql({ query, variables, key: 'setAdvertiserContacts', loggedIn: true });
        expect(res).to.be.an('object');
      });
    });

  });
});
