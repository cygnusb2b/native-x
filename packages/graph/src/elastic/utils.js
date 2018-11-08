const { Pagination, ElasticPagination } = require('@limit0/mongoose-graphql-pagination');
const { client } = require('./index');

const entityNameDefinitions = {
  exact: {
    suffix: 'exact', props: { boost: 10 },
  },
  root: {
    suffix: null, props: { operator: 'and', boost: 5 },
  },
  phonetic: {
    suffix: 'phonetic', props: { boost: 3 },
  },
  edgeAnd: {
    suffix: 'edge', props: { operator: 'and', boost: 2 },
  },
  edgeOr: {
    suffix: 'edge', props: { boost: 1 },
  },
  ngramAnd: {
    suffix: 'ngram', props: { operator: 'and', boost: 0.5 },
  },
  ngramOr: {
    suffix: 'ngram', props: {},
  },
};

const entityAutocompleteDefinitions = {
  edgeAnd: {
    suffix: 'edge', props: { operator: 'and', boost: 2 },
  },
  edgeOr: {
    suffix: 'edge', props: { boost: 1 },
  },
};

const entityNameQuery = (definitions, query, fieldName) => {
  const should = [];
  Object.keys(definitions).forEach((name) => {
    const def = definitions[name];

    const { suffix, props } = def;
    props.query = query;

    const field = suffix ? `${fieldName}.${suffix}` : fieldName;
    should.push({ match: { [field]: props } });
  });
  return { bool: { should } };
};

const entityMultiNameQuery = (definitions, query, fieldNames) => {
  const should = [];
  Object.keys(definitions).forEach((name) => {
    const def = definitions[name];
    const { suffix, props } = def;
    const match = {
      ...props,
      query,
      type: 'cross_fields',
      fields: fieldNames.map(field => (suffix ? `${field}.${suffix}` : field)),
    };
    should.push({ multi_match: match });
  });
  return { bool: { should } };
};

const createEntityNameQuery = (definitions, query, fieldNames) => {
  if (!fieldNames || !fieldNames.length) throw new Error('You must specify at least one field name');

  if (Array.isArray(fieldNames)) {
    if (fieldNames.length === 1) return entityNameQuery(definitions, query, fieldNames);
    return entityMultiNameQuery(entityNameDefinitions, query, fieldNames);
  }
  return entityNameQuery(definitions, query, fieldNames);
};

module.exports = {
  /**
   *
   * @param {*} Model
   * @param {*} phrase
   * @param {*} query
   * @param {*} params
   */
  paginateSearch(Model, phrase, query, { pagination, postFilter }) {
    if (/[a-f0-9]{24}/.test(phrase)) {
      const criteria = { _id: phrase };
      return new Pagination(Model, { pagination, criteria });
    }
    const { index, type } = Model.esOptions();
    const params = {
      index,
      type,
      body: {
        query,
        post_filter: postFilter,
      },
      searchType: 'dfs_query_then_fetch',
    };
    return new ElasticPagination(Model, client, { params, pagination });
  },

  buildEntityNameQuery(query, fieldNames) {
    return createEntityNameQuery(entityNameDefinitions, query, fieldNames);
  },

  buildEntityAutocomplete(query, fieldNames) {
    return createEntityNameQuery(entityAutocompleteDefinitions, query, fieldNames);
  },

  /**
   * @private
   */
  entityNameQuery,
  entityMultiNameQuery,
};
