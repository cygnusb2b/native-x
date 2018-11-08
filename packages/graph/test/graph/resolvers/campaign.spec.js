require('../../connections');
const { CursorType } = require('@limit0/graphql-custom-types');
const { graphql, setup, teardown } = require('./utils');
const AdvertiserRepo = require('../../../src/repositories/advertiser');
const ContactRepo = require('../../../src/repositories/contact');
const CampaignRepo = require('../../../src/repositories/campaign');
const PlacementRepo = require('../../../src/repositories/placement');
const contactNotifier = require('../../../src/services/contact-notifier');

const sandbox = sinon.createSandbox();

const createAdvertiser = async () => {
  const results = await AdvertiserRepo.seed();
  return results.one();
};

const createContact = async () => {
  const results = await ContactRepo.seed();
  return results.one();
};

const createCampaign = async () => {
  const results = await CampaignRepo.seed();
  return results.one();
};

const createCampaigns = async (count) => {
  const results = await CampaignRepo.seed({ count });
  return results.all();
};

const createPlacement = async () => {
  const results = await PlacementRepo.seed();
  return results.one();
};

describe('graph/resolvers/campaign', function() {
  before(async function() {
    await setup();
    await CampaignRepo.remove();
    await PlacementRepo.remove();
    await AdvertiserRepo.remove();
  });
  after(async function() {
    await teardown();
    await CampaignRepo.remove();
    await PlacementRepo.remove();
    await AdvertiserRepo.remove();
  });
  describe('Query', function() {

    describe('campaign', function() {
      let campaign;
      before(async function() {
        campaign = await createCampaign();
      });

      const query = `
        query Campaign($input: ModelIdInput!) {
          campaign(input: $input) {
            id
            name
            createdAt
            updatedAt
            advertiser {
              id
              name
            }
            status
            url
            creatives {
              id
              title
              teaser
              image {
                id
                src
                filename
                size
                mimeType
                width
                height
                focalPoint {
                  x
                  y
                }
              }
            }
            externalLinks {
              label
              url
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
            criteria {
              start
              end
              placements {
                id
                name
              }
              kvs {
                key
                value
              }
            }
          }
        }
      `;
      it('should reject when no user is logged-in.', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'campaign', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject if no record was found.', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'campaign', loggedIn: true })).to.be.rejectedWith(Error, `No campaign record found for ID ${id}.`);
      });
      it('should return the requested campaign.', async function() {
        const id = campaign.id;
        const input = { id };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'campaign', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id', id);
        const data = await promise;
        expect(data).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt', 'advertiser', 'status', 'url', 'creatives', 'criteria', 'externalLinks', 'notify');
      });
    });


    // describe('campaignHash', function() {
    //   let campaign;
    //   before(async function() {
    //     campaign = await createCampaign();
    //   });

    //   const query = `
    //     query CampaignHash($input: CampaignHashInput!) {
    //       campaignHash(input: $input) {
    //         hash
    //         name
    //         createdAt
    //         updatedAt
    //         advertiser {
    //           id
    //           name
    //         }
    //         status
    //         url
    //         notify {
    //           external {
    //             name
    //             email
    //           }
    //         }
    //         creatives {
    //           id
    //           title
    //           teaser
    //           image {
    //             id
    //             src
    //             filename
    //             mimeType
    //             size
    //             width
    //             height
    //             focalPoint {
    //               x
    //               y
    //             }
    //           }
    //         }
    //       }
    //     }
    //   `;
    //   it('should not reject when no user is logged-in.', async function() {
    //     const hash = campaign.hash;
    //     const input = { hash };
    //     const variables = { input };
    //     const promise = graphql({ query, variables, key: 'campaignHash', loggedIn: false });
    //     await expect(promise).to.eventually.be.an('object').with.property('hash', hash);
    //   });
    //   it('should reject if no record was found.', async function() {
    //     const hash = '507f1f77bcf86cd799439011';
    //     const input = { hash };
    //     const variables = { input };
    //     await expect(graphql({ query, variables, key: 'campaignHash', loggedIn: true })).to.be.rejectedWith(Error, `No campaign record found for hash ${hash}.`);
    //   });
    //   it('should return the requested campaign.', async function() {
    //     const hash = campaign.hash;
    //     const input = { hash };
    //     const variables = { input };
    //     const promise = graphql({ query, variables, key: 'campaignHash', loggedIn: true });
    //     await expect(promise).to.eventually.be.an('object').with.property('hash', hash);
    //     const data = await promise;
    //     expect(data).to.have.all.keys('hash', 'name', 'createdAt', 'updatedAt', 'advertiser', 'status', 'url', 'creatives', 'notify');
    //   });
    // });

    describe('allCampaigns', function() {
      let campaigns;
      before(async function() {
        await CampaignRepo.remove();
        campaigns = await createCampaigns(10);
      });
      after(async function() {
        await CampaignRepo.remove();
      });
      const query = `
        query AllCampaigns($pagination: PaginationInput, $sort: CampaignSortInput) {
          allCampaigns(pagination: $pagination, sort: $sort) {
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
        await expect(graphql({ query, key: 'allCampaigns', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should return five advertisers out of ten.', async function() {
        const pagination = { first: 5 };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allCampaigns', variables, loggedIn: true });
        await expect(promise).to.eventually.be.an('object');
        const data = await promise;
        expect(data.totalCount).to.equal(10);
        expect(data.edges.length).to.equal(5);
        expect(data.pageInfo.hasNextPage).to.be.true;
        expect(data.pageInfo.endCursor).to.be.a('string');

        const last = data.edges.pop();
        expect(data.pageInfo.endCursor).to.equal(last.cursor);
      });
      it('should not have a next page when limited by more than the total.', async function() {
        const pagination = { first: 50 };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allCampaigns', variables, loggedIn: true });
        await expect(promise).to.eventually.be.an('object');
        const data = await promise;
        expect(data.totalCount).to.equal(10);
        expect(data.edges.length).to.equal(10);
        expect(data.pageInfo.hasNextPage).to.be.false;
      });
      it('should return an error when an after cursor is requested that does not exist.', async function() {
        const { id } = CampaignRepo.generate(1, { advertiserId: () => '1234', placementId: () => '2345' }).one();
        const after = CursorType.serialize(id);
        const pagination = { first: 5, after };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allCampaigns', variables, loggedIn: true });
        await expect(promise).to.be.rejectedWith(Error, `No record found for ID '${id}'`);
      });
    });

  });

  // describe('Mutation', function() {

  //   describe('createCampaign', function() {
  //     let advertiser;
  //     before(async function() {
  //       advertiser = await createAdvertiser();
  //       // stub @sendgrid/mail::send
  //       sandbox.stub(contactNotifier, 'sendInternalCampaignCreated').resolves();
  //       sandbox.stub(contactNotifier, 'sendExternalCampaignCreated').resolves();

  //       // mailStub = sinon.stub(sgMail, 'send');
  //       // keystub = sinon.stub(sgMail, 'setApiKey');
  //     });
  //     after(async function() {
  //       await AdvertiserRepo.remove();
  //       sandbox.restore();
  //     });
  //     const query = `
  //       mutation CreateCampaign($input: CreateCampaignInput!) {
  //         createCampaign(input: $input) {
  //           id
  //           name
  //         }
  //       }
  //     `;

  //     it('should reject when no user is logged-in.', async function() {
  //       const payload = {
  //         name: 'Test Campaign',
  //         advertiserId: advertiser.id,
  //         url: 'https://www.google.com',
  //       };
  //       const input = { payload };
  //       const variables = { input };
  //       await expect(graphql({ query, variables, key: 'createCampaign', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
  //     });
  //     it('should create the campaign.', async function() {
  //       const payload = {
  //         name: 'Test Campaign',
  //         advertiserId: advertiser.id,
  //         url: 'https://www.google.com',
  //         externalLinks: [ { label: 'test', url: 'https://goo.gl/404' } ],
  //         startDate: Date.now(),
  //       };
  //       const input = { payload };
  //       const variables = { input };
  //       const promise = graphql({ query, variables, key: 'createCampaign', loggedIn: true });
  //       await expect(promise).to.eventually.be.an('object').with.property('id');
  //       const data = await promise;
  //       await expect(CampaignRepo.findById(data.id)).to.eventually.be.an('object').with.property('name', payload.name);
  //       sandbox.assert.calledOnce(contactNotifier.sendInternalCampaignCreated);
  //       sandbox.assert.calledOnce(contactNotifier.sendExternalCampaignCreated);
  //     });
  //   });

  //   describe('updateCampaign', function() {
  //     let campaign;
  //     before(async function() {
  //       campaign = await createCampaign();
  //     });
  //     after(async function() {
  //       await CampaignRepo.remove();
  //       await AdvertiserRepo.remove();
  //     });

  //     const query = `
  //       mutation UpdateCampaign($input: UpdateCampaignInput!) {
  //         updateCampaign(input: $input) {
  //           id
  //           url
  //           name
  //           status
  //           advertiser {
  //             id
  //             name
  //           }
  //           externalLinks {
  //             label
  //             url
  //           }
  //           notify {
  //             internal {
  //               name
  //               email
  //             }
  //             external {
  //               name
  //               email
  //             }
  //           }
  //         }
  //       }
  //     `;
  //     const payload = {
  //       name: 'Updated Campaign Name',
  //       description: 'Fancy client-facing description',
  //       url: 'https://someupdatedurl.com',
  //       status: 'Deleted',
  //     };

  //     it('should reject when no user is logged-in.', async function() {
  //       const id = '507f1f77bcf86cd799439011'
  //       const input = { id, payload };
  //       const variables = { input };
  //       await expect(graphql({ query, variables, key: 'updateCampaign', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
  //     });
  //     it('should reject when the campaign record is not found.', async function() {
  //       const id = '507f1f77bcf86cd799439011'
  //       const input = { id, payload };
  //       const variables = { input };
  //       await expect(graphql({ query, variables, key: 'updateCampaign', loggedIn: true })).to.be.rejectedWith(Error, `Unable to update campaign: no record was found for ID '${id}'`);
  //     });
  //     it('should update the campaign.', async function() {
  //       const id = campaign.id;
  //       const advertiser = await createAdvertiser();
  //       payload.advertiserId = advertiser.id;
  //       payload.externalLinks = [ { label: 'test', url: 'https://google.com/404' } ];
  //       const input = { id, payload };
  //       const variables = { input };
  //       const promise = graphql({ query, variables, key: 'updateCampaign', loggedIn: true });
  //       await expect(promise).to.eventually.be.an('object').with.property('id');
  //       const data = await promise;
  //       expect(data.name).to.equal(payload.name);
  //       expect(data.url).to.equal(payload.url);
  //       expect(data.status).to.equal(payload.status);
  //       expect(data.advertiser.id).to.equal(payload.advertiserId);
  //       expect(data.externalLinks[0].url).to.equal(payload.externalLinks[0].url);
  //       await expect(CampaignRepo.findById(data.id)).to.eventually.be.an('object').with.property('name', payload.name);
  //     });
  //   });

  //   describe('addCampaignCreative', function() {
  //     let campaign;
  //     before(async function() {
  //       campaign = await createCampaign();
  //     });
  //     const query = `
  //       mutation AddCampaignCreative($input: AddCampaignCreativeInput!) {
  //         addCampaignCreative(input: $input) {
  //           id
  //           title
  //           teaser
  //           image {
  //             id
  //           }
  //         }
  //       }
  //     `;
  //     it('should reject when no user is logged-in.', async function() {
  //       const campaignId = campaign.id;
  //       const input = { campaignId };
  //       const variables = { input };
  //       await expect(graphql({ query, variables, key: 'addCampaignCreative', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
  //     });
  //     it('should reject when the campaign record is not found.', async function() {
  //       const campaignId = '507f1f77bcf86cd799439011'
  //       const input = { campaignId };
  //       const variables = { input };
  //       await expect(graphql({ query, variables, key: 'addCampaignCreative', loggedIn: true })).to.be.rejectedWith(Error, /no campaign was found/i);
  //     });
  //     it('should add the campaign creative.', async function() {
  //       const campaignId = campaign.id;
  //       const payload = { title: 'Some creative title', teaser: 'Some teaser.' };
  //       const input = { campaignId, payload };
  //       const variables = { input };
  //       const promise = graphql({ query, variables, key: 'addCampaignCreative', loggedIn: true });
  //       await expect(promise).to.eventually.be.an('object');
  //       const data = await promise;
  //       expect(data.title).to.equal(payload.title);
  //       expect(data.teaser).to.equal(payload.teaser);
  //       expect(data.image).to.be.null;
  //       const found = await CampaignRepo.findById(campaignId);
  //       expect(found.creatives.id(data.id)).to.be.an('object');
  //     });
  //   });

  //   describe('campaignCreativeDetails', function() {
  //     let campaign;
  //     before(async function() {
  //       campaign = await createCampaign();
  //       creative = campaign.creatives[0];
  //     });
  //     const query = `
  //       mutation CampaignCreativeDetails($input: CampaignCreativeDetailsInput!) {
  //         campaignCreativeDetails(input: $input) {
  //           id
  //           title
  //           teaser
  //         }
  //       }
  //     `;
  //     it('should reject when no user is logged-in.', async function() {
  //       const campaignId = campaign.id;
  //       const creativeId = creative.id;
  //       const input = { campaignId, creativeId };
  //       const variables = { input };
  //       await expect(graphql({ query, variables, key: 'campaignCreativeDetails', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
  //     });
  //     it('should reject when the campaign record is not found.', async function() {
  //       const campaignId = '507f1f77bcf86cd799439011';
  //       const creativeId = creative.id;
  //       const payload = { title: 'Foo' };
  //       const input = { campaignId, creativeId, payload };
  //       const variables = { input };
  //       await expect(graphql({ query, variables, key: 'campaignCreativeDetails', loggedIn: true })).to.be.rejectedWith(Error, /no campaign was found/i);
  //     });
  //     it('should reject when the campaign creative record is not found.', async function() {
  //       const campaignId = campaign.id;
  //       const creativeId = '507f1f77bcf86cd799439011';
  //       const payload = { title: 'Foo' };
  //       const input = { campaignId, creativeId, payload };
  //       const variables = { input };
  //       await expect(graphql({ query, variables, key: 'campaignCreativeDetails', loggedIn: true })).to.be.rejectedWith(Error, /no creative was found/i);
  //     });
  //     it('should update the campaign creative.', async function() {
  //       const campaignId = campaign.id;
  //       const creativeId = creative.id;
  //       const payload = { title: 'This is a new title', teaser: 'This is a new teaser.' };
  //       const input = { campaignId, creativeId, payload };
  //       const variables = { input };
  //       const promise = graphql({ query, variables, key: 'campaignCreativeDetails', loggedIn: true });
  //       await expect(promise).to.eventually.be.an('object');
  //       const data = await promise;
  //       expect(data.title).to.equal(payload.title);
  //       expect(data.teaser).to.equal(payload.teaser);
  //       const found = await CampaignRepo.findById(campaignId);
  //       expect(found.creatives.id(data.id)).to.be.an('object');
  //     });
  //   });

  //   describe('removeCampaignCreative', function() {
  //     let campaign;
  //     before(async function() {
  //       campaign = await createCampaign();
  //     });
  //     const query = `
  //       mutation RemoveCampaignCreative($input: RemoveCampaignCreativeInput!) {
  //         removeCampaignCreative(input: $input)
  //       }
  //     `;
  //     it('should reject when no user is logged-in.', async function() {
  //       const campaignId = campaign.id;
  //       const creativeId = campaign.get('creatives.0.id');
  //       const input = { campaignId, creativeId };
  //       const variables = { input };
  //       await expect(graphql({ query, variables, key: 'removeCampaignCreative', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
  //     });
  //     it('should reject when the campaign record is not found.', async function() {
  //       const campaignId = '507f1f77bcf86cd799439011';
  //       const creativeId = campaignId;
  //       const input = { campaignId, creativeId };
  //       const variables = { input };
  //       await expect(graphql({ query, variables, key: 'removeCampaignCreative', loggedIn: true })).to.be.rejectedWith(Error, /no campaign was found/i);
  //     });
  //     it('should remove the campaign creative.', async function() {
  //       const campaignId = campaign.id;
  //       const creativeId = campaign.get('creatives.0.id');
  //       const input = { campaignId, creativeId };
  //       const variables = { input };
  //       const promise = graphql({ query, variables, key: 'removeCampaignCreative', loggedIn: true });
  //       await expect(promise).to.eventually.equal('ok');
  //       const found = await CampaignRepo.findById(campaignId);
  //       expect(found.creatives.id(creativeId)).to.be.null;
  //     });
  //   });

  //   describe('campaignCriteria', function() {
  //     const start = new Date().getTime();
  //     let campaign;
  //     let placement;
  //     before(async function() {
  //       campaign = await createCampaign();
  //       placement = await createPlacement();
  //     });
  //     const query = `
  //       mutation CampaignCriteria($input: CampaignCriteriaInput!) {
  //         campaignCriteria(input: $input) {
  //           start
  //           end
  //           placements {
  //             id
  //             name
  //           }
  //           kvs {
  //             key
  //             value
  //           }
  //         }
  //       }
  //     `;
  //     it('should reject when no user is logged-in', async function() {
  //       const campaignId = campaign.id;
  //       const input = { campaignId };
  //       const payload = { start };
  //       const variables = { input, payload };
  //       await expect(graphql({ query, variables, key: 'campaignCriteria', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
  //     });
  //     it('should reject when the campaign record is not found', async function() {
  //       const campaignId = '507f1f77bcf86cd799439011'
  //       const input = { campaignId };
  //       const payload = { start };
  //       const variables = { input, payload };
  //       await expect(graphql({ query, variables, key: 'campaignCriteria', loggedIn: true })).to.be.rejectedWith(Error, /no campaign was found/i);
  //     });
  //     it('should reject when the placement record is not found', async function() {
  //       const campaignId = campaign.id;
  //       const placementIds = [ '507f1f77bcf86cd799439011' ];
  //       const payload = { start, placementIds };
  //       const input = { campaignId, payload };
  //       const variables = { input };
  //       await expect(graphql({ query, variables, key: 'campaignCriteria', loggedIn: true })).to.be.rejectedWith(Error, /no placement found/i);
  //     });
  //     it('should reject when the placement is not provided', async function() {
  //       const campaignId = campaign.id;
  //       const placementIds = [ null ];
  //       const payload = { start, placementIds };
  //       const input = { campaignId, payload };
  //       const variables = { input };
  //       await expect(graphql({ query, variables, key: 'campaignCriteria', loggedIn: true })).to.be.rejectedWith(Error, /not to be null at value\.payload\.placementIds/i);
  //     });
  //     it('should set the campaign criteria', async function() {
  //       const campaignId = campaign.id;
  //       const placementIds = [ placement.id ];
  //       const payload = { start, placementIds };
  //       const input = { campaignId, payload };
  //       const variables = { input };
  //       const promise = graphql({ query, variables, key: 'campaignCriteria', loggedIn: true });
  //       await expect(promise).to.eventually.be.an('object');
  //       const data = await promise;
  //       expect(data.start).to.equal(payload.start);

  //       const rPlacement = data.placements[0];
  //       expect(rPlacement).to.be.an('object').with.property('name');
  //       expect(rPlacement).to.deep.include({ id: payload.placementIds[0] });
  //       const found = await CampaignRepo.findById(campaignId);
  //       expect(found.criteria).to.be.an('object');
  //     });
  //   });


  //   describe('campaignContacts', function() {
  //     let campaign;
  //     let contact;
  //     let contactIds;
  //     before(async function() {
  //       campaign = await createCampaign();
  //       contact = await createContact();
  //       contactIds = [ contact.id ];
  //     });
  //     const type = 'internal';
  //     const query = `
  //       mutation CampaignContacts($input: SetContactsInput!) {
  //         campaignContacts(input: $input) {
  //           id
  //         }
  //       }
  //     `;

  //     it('should reject when no user is logged-in', async function() {
  //       const id = campaign.id;
  //       const input = { id, type, contactIds };
  //       const variables = { input };
  //       await expect(graphql({ query, variables, key: 'campaignContacts', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
  //     });
  //     it('should reject when the campaign record is not found', async function() {
  //       const id = '507f1f77bcf86cd799439011'
  //       const input = { id, type, contactIds };
  //       const variables = { input };
  //       await expect(graphql({ query, variables, key: 'campaignContacts', loggedIn: true })).to.be.rejectedWith(Error, /no record was found/i);
  //     });
  //     it('should reject when the contact record is not found', async function() {
  //       const id = campaign.id;
  //       const cids = [ '507f1f77bcf86cd799439011' ];
  //       const input = { id, type, contactIds: cids };
  //       const variables = { input };
  //       await expect(graphql({ query, variables, key: 'campaignContacts', loggedIn: true })).to.be.rejectedWith(Error, /no contact found/i);
  //     });

  //     it('should not reject when the contact is already added', async function() {
  //       const id = campaign.id;
  //       const input = { id, type, contactIds };
  //       const variables = { input };
  //       await graphql({ query, variables, key: 'campaignContacts', loggedIn: true });
  //       const res = await graphql({ query, variables, key: 'campaignContacts', loggedIn: true });
  //       expect(res).to.be.an('object');
  //     });

  //     it('should add the contact to the campaign', async function() {
  //       const id = campaign.id;
  //       const input = { id, type, contactIds };
  //       const variables = { input };
  //       const res = await graphql({ query, variables, key: 'campaignContacts', loggedIn: true });
  //       expect(res).to.be.an('object');
  //     });
  //   });


  // });
});
