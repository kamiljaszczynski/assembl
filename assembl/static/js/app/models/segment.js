'use strict';
/**
 * A segment of text extracted from a message. Can be associated to an idea, otherwise in clipboard.
 * @module app.models.segment
 */

var _ = require('underscore'),
    Base = require('./base.js'),
    Promise = require('bluebird'),
    Ctx = require('../common/context.js'),
    Agents = require('./agents.js'),
    Message = require('./message.js'),
    Types = require('../utils/types.js'),
    i18n = require('../utils/i18n.js');

/**
 * Segment model
 * Frontend model for :py:class:`assembl.models.idea_content_link.Extract`
 * @class app.models.segment.SegmentModel
 * @extends app.models.base.BaseModel
 */
 
var SegmentModel = Base.Model.extend({
  constructor: function SegmentModel() {
    Base.Model.apply(this, arguments);
  },

  /**
   * @init
   */
  initialize: function() {
    if (this.attributes.created) {
      this.attributes.creationDate = this.attributes.created;
    }

    if (!this.get('creationDate')) {
      this.set('creationDate', Ctx.getCurrentTime());
    }

    var ranges = this.attributes.ranges,
        _serializedRange = [],
        _ranges = [];

    _.each(ranges, function(range, index) {

      if (!(range instanceof Annotator.Range.SerializedRange)) {
        ranges[index] = new Annotator.Range.SerializedRange(range);
      }

      _ranges[index] = ranges[index];

    });

    // We need to create a copy 'cause annotator destroy all ranges
    // once it creates the highlight
    this.attributes._ranges = _ranges;
    var that = this;

    this.listenTo(this, "change:idIdea", function() {
      that.collection.collectionManager.getAllIdeasCollectionPromise()
                .done(function(allIdeasCollection) {
                  var previousIdea,
                      idea;

                  if (that.previous("idIdea") !== null) {
                    previousIdea = allIdeasCollection.get(that.previous("idIdea"));

                    //console.log("Segment:initialize:triggering idea change (previous idea)");
                    previousIdea.trigger('change');
                  }

                  if (that.get('idIdea') !== null) {

                    idea = allIdeasCollection.get(that.get('idIdea'));

                    //console.log("Segment:initialize:triggering idea change (new idea)");
                    idea.trigger('change');
                  }
                });
    })

    // cleaning
    delete this.attributes.highlights;
  },

  /**
   * @type {string}
   */
  urlRoot: Ctx.getApiUrl("extracts"),

  /**
   * @type {Object}
   */
  defaults: {
    text: '',
    quote: '',
    idPost: null,
    idIdea: null,
    creationDate: null,
    idCreator: null,
    important: false,
    ranges: [],
    target: null
  },

  /**
   * Validation
   */
  validate: function(attrs, options) {
    var currentUser = Ctx.getCurrentUser(),
        id = currentUser.getId();

    if (!id) {
      return i18n.gettext('You must be logged in to create segments');
    }

    /*
     * Extracts CAN have a null idPost: it is the case for extracts harvested from a distant webpage.
     * But if the extract has no idPost field, then it must have an uri field.
    if (attrs.idPost === null || typeof attrs.idPost !== 'string') {
        return i18n.gettext('invalid idPost: ' + attrs.idPost);
    }
    */
    if ((attrs.idPost === null || typeof attrs.idPost !== 'string') && (attrs.uri === null || typeof attrs.uri !== 'string')) {
      return i18n.gettext('invalid extract: the extract must have a valid idPost (here ' + attrs.idPost + ') or a valid uri (here ' + attrs.uri + ')');
    }

    if (attrs.creationDate === null) {
      return i18n.gettext('invalid creationDate: ' + attrs.creationDate);
    }

    if (attrs.idIdea !== null && typeof attrs.idIdea !== 'string') {
      return i18n.gettext('invalid idIdea: ' + attrs.idIdea);
    }

    if (attrs.idCreator === null || typeof attrs.idCreator !== 'string') {
      return i18n.gettext('invalid idCreator: ' + attrs.idCreator);
    }

  },

  /** Return a promise for the Post the segments is associated to, if any
   * @returns {$.Defered.Promise}
   */
  getAssociatedIdeaPromise: function() {
      var that = this,
          idIdea = this.get('idIdea');
      if (idIdea) {
        return this.collection.collectionManager.getAllIdeasCollectionPromise().then(function(allIdeasCollection) {
          return allIdeasCollection.get(idIdea);
        });
      }
      else {
        return Promise.resolve(null);
      }

    },

  /** Return a promise for the Post the segments is associated to, if any
   * @returns {$.Defered.Promise}
   */
  getAssociatedPostPromise: function() {
    return this.collection.collectionManager.getMessageFullModelPromise(this.get('idPost'));
  },

  /**
   * Return the html markup to the icon
   * @returns {string}
   */
  getTypeIcon: function() {
    var cls = 'icon-',
        target = this.get('target'),
        idPost = this.idPost;

    // todo(Marc-Antonie): review this `type` because `idPost`
    // is a string and doesn't have `@type` attribute

    if (target != null) {
      switch (target['@type']) {
        case 'Webpage':
          cls += 'link';
          break;

        case 'Email':
        case 'Post':
        case 'AssemblPost':
        case 'SynthesisPost':
        case 'ImportedPost':
        default:
          cls += 'mail';
      }
    } else if (idPost != null) {
      cls += 'mail';
    }

    return Ctx.format("<i class='{0}'></i>", cls);
  },

  /**
   * Returns the extract's creator from a collection provided
   * @param {Collection} The collection to get the user models from
   * @returns {User}
   */
  getCreatorFromUsersCollection: function(usersCollection) {
    var creatorId = this.get('idCreator'),
        creator = usersCollection.getById(creatorId);
    if (!creatorId) {
      throw new Error("A segment cannot have an empty creator");
    }

    return creator;
  },

  /**
   * Alias for `.get('quote') || .get('text')`
   * @returns {string}
   */
  getQuote: function() {
    return this.get('quote') || this.get('text');
  },

  getCreatedTime: function() {
    if (!this.createdTime) {
      this.createdTime = (new Date(this.get('created'))).getTime();
    }

    return this.createdTime;
  }
});

/**
 * Segment collection
 * @class app.models.segment.SegmentCollection
 * @extends app.models.base.BaseCollection
 */
 
var SegmentCollection = Base.Collection.extend({
  constructor: function SegmentCollection() {
    Base.Collection.apply(this, arguments);
  },

  /**
   * @type {string}
   */
  url: Ctx.getApiUrl("extracts"),

  /**
   * @type {IdeaModel}
   */
  model: SegmentModel,

  /**
   * @init
   */
  initialize: function() {

  },

  /**
   * Returns the segment related to the annotation
   * @param  {annotation} annotation
   * @returns {Segment}
   */
  getByAnnotation: function(annotation) {
    return this.get(annotation['@id']);
  },

  /**
   * Transform an annotator annotation as an extract.
   * The segment isn't saved.
   * @param {annotation} annotation
   * @param {number} [idIdea=null]
   * @returns {Segment}
   */
  addAnnotationAsExtract: function(annotation, idIdea) {
    var that = this,
        idPost = Ctx.getPostIdFromAnnotation(annotation);

    //console.log("addAnnotationAsExtract called");

    var segment = new SegmentModel({
      target: { "@id": idPost, "@type": Types.EMAIL },
      text: annotation.text,
      quote: annotation.quote,
      idCreator: Ctx.getCurrentUser().getId(),
      ranges: annotation.ranges,
      idPost: idPost,
      idIdea: idIdea
    });

    if (segment.isValid()) {
      delete segment.attributes.highlights;
      this.add(segment);
    }
    else {
      alert(segment.validationError);
    }

    return segment;
  }

});

module.exports = {
  Model: SegmentModel,
  Collection: SegmentCollection
};

