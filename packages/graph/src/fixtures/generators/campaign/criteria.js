const faker = require('faker');

module.exports = ({ placementId }) => {
  const kvs = () => {
    const stack = [];
    const num = faker.random.number({ min: 1, max: 5 });
    for (let i = 0; i < num; i += 1) {
      stack.push({
        key: faker.lorem.slug(faker.random.number({ min: 1, max: 2 })),
        value: faker.internet.password(),
      });
    }
    return stack;
  };

  return {
    start: faker.date.past(),
    end: faker.date.future(),
    placements: [placementId()],
    kvs: kvs(),
  };
};
