export const pagesIndexDefinition = {
  mappings: {
    _doc: {
      enabled: false
    }
  }
};

export const sectionsIndexDefinition = {
  settings: {
    analysis: {
      analyzer: {
        english_ngram: {
          type: 'custom',
          filter: [
            'english_possessive_stemmer',
            'lowercase',
            'english_stop',
            'english_stemmer',
            'ngram_filter'
          ],
          tokenizer: 'whitespace'
        }
      },
      filter: {
        english_stop: {
          type: 'stop'
        },
        english_stemmer: {
          type: 'stemmer',
          language: 'english'
        },
        english_possessive_stemmer: {
          type: 'stemmer',
          language: 'possessive_english'
        },
        ngram_filter: {
          type: 'edge_ngram',
          min_gram: 1,
          max_gram: 25
        }
      }
    }
  },
  mappings: {
    _doc: {
      properties: {
        id: { type: 'keyword' },
        path: { type: 'keyword' },
        text: { type: 'text', analyzer: 'english_ngram' },
        heading: {
          properties: {
            level: { type: 'long' },
            slug: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256
                }
              }
            },
            title: { type: 'text' },
            titleHtml: { type: 'text' }
          }
        }
      }
    }
  }
};

export const headingsIndexDefinition = {
  settings: {
    analysis: {
      analyzer: {
        english_ngram: {
          type: 'custom',
          filter: [
            'english_possessive_stemmer',
            'lowercase',
            'english_stop',
            'english_stemmer',
            'ngram_filter'
          ],
          tokenizer: 'whitespace'
        }
      },
      filter: {
        english_stop: {
          type: 'stop'
        },
        english_stemmer: {
          type: 'stemmer',
          language: 'english'
        },
        english_possessive_stemmer: {
          type: 'stemmer',
          language: 'possessive_english'
        },
        ngram_filter: {
          type: 'edge_ngram',
          min_gram: 1,
          max_gram: 25
        }
      }
    }
  },
  mappings: {
    _doc: {
      properties: {
        id: { type: 'keyword' },
        path: { type: 'keyword' },
        level: { type: 'long' },
        slug: { type: 'keyword' },
        title: { type: 'text', analyzer: 'english_ngram' },
        titleHtml: { type: 'text' }
      }
    }
  }
};

export const staticIndexDefinition = {
  mappings: {
    _doc: {
      enabled: false
    }
  }
};
