'use strict';

define(function(require){

  var Assembl = require('modules/assembl'),
      Message = require('models/message'),
    groupSpec = require('models/groupSpec'),
         Idea = require('models/idea'),
     IdeaLink = require('models/ideaLink'),
      Segment = require('models/segment'),
    Synthesis = require('models/synthesis'),
   PartnerOrg = require('models/partner_organization'),
         User = require('models/user'),
            $ = require('jquery'),
      Storage = require('objects/storage'),
        Types = require('utils/types'),
         i18n = require('utils/i18n');

  /**
   * @class CollectionManager
   * 
   * A singleton to manage lazy loading of server collections
   */
  var CollectionManager = Marionette.Controller.extend({
    /**
     * Collection with all users in the discussion.
     * @type {UserCollection}
     */
    _allUsersCollection : undefined,
    
    _allUsersCollectionPromise : undefined,
    
    /**
     * Collection with all messsages in the discussion.
     * @type {MessageCollection}
     */
    _allMessageStructureCollection : undefined,
    
    _allMessageStructureCollectionPromise : undefined,

    /**
     * Collection with all synthesis in the discussion.
     * @type {SynthesisCollection}
     */
    _allSynthesisCollection : undefined,

    _allSynthesisCollectionPromise : undefined,

    /**
     * Collection with all ideas in the discussion.
     * @type {SegmentCollection}
     */
    _allIdeasCollection : undefined,
    
    _allIdeasCollectionPromise : undefined,
    
    /**
     * Collection with all idea links in the discussion.
     * @type {MessageCollection}
     */
    _allIdeaLinksCollection : undefined,
    
    _allIdeaLinksCollectionPromise : undefined,

    /**
     * Collection with all extracts in the discussion.
     * @type {SegmentCollection}
     */
    _allExtractsCollection : undefined,
    
    _allExtractsCollectionPromise : undefined,
    
    /**
     * Collectin with a definition of the user's view
     * @type {GroupSpec}
     */
    _allGroupSpecsCollection : undefined,

    _allGroupSpecsCollectionPromise: undefined,

    /**
     * Collection with all partner organization in the discussion.
     * @type {PartnerOrganizationCollection}
     */
    _allPartnerOrganizationCollection : undefined,

    _allPartnerOrganizationCollectionPromise: undefined,


    initialize: function(options){

    },
    

    /**
     * Returns the collection from the giving object's @type .
     * Used by the socket to sync the collection.
     * @param {BaseModel} item
     * @param {String} [type=item['@type']] The model type
     * @return {BaseCollection}
     */
    getCollectionPromiseByType: function(item, type){
        type = type || item['@type'];

        switch(type){
            case Types.EXTRACT:
                return this.getAllExtractsCollectionPromise();

            case Types.IDEA:
            case Types.ROOT_IDEA:
            case Types.PROPOSAL:
            case Types.ISSUE:
            case Types.CRITERION:
            case Types.ARGUMENT:
                return this.getAllIdeasCollectionPromise();

            case Types.IDEA_LINK:
                return this.getAllIdeaLinksCollectionPromise();

            case Types.POST:
            case Types.ASSEMBL_POST:
            case Types.SYNTHESIS_POST:
            case Types.IMPORTED_POST:
            case Types.EMAIL:
            case Types.IDEA_PROPOSAL_POST:
                return this.getAllMessageStructureCollectionPromise();

            case Types.USER:
                return this.getAllUsersCollectionPromise();

            case Types.SYNTHESIS:
                return this.getAllSynthesisCollectionPromise();

            case Types.PARTNER_ORGANIZATION:
                return this.getAllPartnerOrganizationCollectionPromise();
        }

        return null;
    },
    
    getAllUsersCollectionPromise : function() {
      var that = this,
      deferred = $.Deferred();

      if (this._allUsersCollectionPromise === undefined) {
        this._allUsersCollection = new User.Collection();
        this._allUsersCollection.collectionManager = this;
        this._allUsersCollectionPromise = this._allUsersCollection.fetchFromScriptTag('users-json');
        this._allUsersCollectionPromise.done(function() {
          deferred.resolve(that._allUsersCollection);
        });
      }
      else {
        this._allUsersCollectionPromise.done(function(){
          deferred.resolve(that._allUsersCollection);
        });
      }
      return deferred.promise();
    },
  
    getAllMessageStructureCollectionPromise : function() {
      var that = this,
      deferred = $.Deferred();

      if (this._allMessageStructureCollectionPromise === undefined) {
        this._allMessageStructureCollection = new Message.Collection();
        this._allMessageStructureCollection.collectionManager = this;
        this._allMessageStructureCollectionPromise = this._allMessageStructureCollection.fetch({
          success: function(collection, response, options) {
            deferred.resolve(that._allMessageStructureCollection);
          }
        });
      }
      else {
        this._allMessageStructureCollectionPromise.done(function(){
          deferred.resolve(that._allMessageStructureCollection);
        });
      }
      return deferred.promise();
    },
    
    getAllSynthesisCollectionPromise : function() {
      var that = this,
      deferred = $.Deferred();

      if (this._allSynthesisCollectionPromise === undefined) {
        this._allSynthesisCollection = new Synthesis.Collection();
        this._allSynthesisCollection.collectionManager = this;
        this._allSynthesisCollectionPromise = this._allSynthesisCollection.fetch({
          success: function(collection, response, options) {
            deferred.resolve(that._allSynthesisCollection);
          }
        });
      }
      else {
        this._allSynthesisCollectionPromise.done(function(){
          deferred.resolve(that._allSynthesisCollection);
        });
      }
      return deferred.promise();
    },

    getAllIdeasCollectionPromise : function() {
      var that = this,
      deferred = $.Deferred();

      if (this._allIdeasCollectionPromise === undefined) {
        this._allIdeasCollection = new Idea.Collection();
        this._allIdeasCollection.collectionManager = this;
        this._allIdeasCollectionPromise = this._allIdeasCollection.fetchFromScriptTag('ideas-json');
        this._allIdeasCollectionPromise.done(function(collection, response, options) {
          deferred.resolve(that._allIdeasCollection);
          //Start listener setup
          /*
            this.listenTo(this.ideas, "all", function(eventName) {
              console.log("ideaList collection event received: ", eventName);
            });
            */
            
          //This is so the unread count update when setting a message unread.
          //See Message:setRead()
          Assembl.reqres.setHandler('ideas:update', function(ideas){
            if(Ctx.debugRender) {
              console.log("ideaList: triggering render because app.on('ideas:update') was triggered");
            }
            that._allIdeasCollection.add(ideas, {merge: true});
          });
          
          //End listener setup
        });
      }
      else {
        this._allIdeasCollectionPromise.done(function(){
          deferred.resolve(that._allIdeasCollection);
        });
      }
      return deferred.promise();
    },   
    
    getAllIdeaLinksCollectionPromise : function() {
      var that = this,
      deferred = $.Deferred();

      if (this._allIdeaLinksCollectionPromise === undefined) {
        this._allIdeaLinksCollection = new IdeaLink.Collection();
        this._allIdeaLinksCollection.collectionManager = this;
        this._allIdeaLinksCollectionPromise = deferred.promise();
        deferred.resolve(this._allIdeaLinksCollection);
      }
      return this._allIdeaLinksCollectionPromise;
    },
    
    getAllExtractsCollectionPromise : function() {
      var that = this,
      deferred = $.Deferred();

      if (this._allExtractsCollectionPromise === undefined) {
        this._allExtractsCollection = new Segment.Collection();
        this._allExtractsCollection.collectionManager = this;
        this._allExtractsCollectionPromise = this._allExtractsCollection.fetchFromScriptTag('extracts-json');
        this._allExtractsCollectionPromise.done(function() {
          deferred.resolve(that._allExtractsCollection);
        });
      }
      else {
        this._allExtractsCollectionPromise.done(function(){
          deferred.resolve(that._allExtractsCollection);
        });
      }
      return deferred.promise();
    },

    getAllPartnerOrganizationCollectionPromise : function() {
      var that = this,
      deferred = $.Deferred();

      if (this._allPartnerOrganizationCollectionPromise === undefined) {
        this._allPartnerOrganizationCollection = new PartnerOrg.Collection();
        this._allPartnerOrganizationCollection.collectionManager = this;
        this._allPartnerOrganizationCollectionPromise = this._allPartnerOrganizationCollection.fetch();
        this._allPartnerOrganizationCollectionPromise.done(function() {
          deferred.resolve(that._allPartnerOrganizationCollection);
        });
      }
      else {
        this._allPartnerOrganizationCollectionPromise.done(function(){
          deferred.resolve(that._allPartnerOrganizationCollection);
        });
      }
      return deferred.promise();
    },

    getGroupSpecsCollectionPromise : function(viewsFactory) {
      var deferred = $.Deferred();

      if (this._allGroupSpecsCollectionPromise === undefined) {
        var collection, data = Storage.getStorageGroupItem()
        if (data !== undefined) {
          collection = new groupSpec.Collection(data, {'parse':true});
          if (!collection.validate(viewsFactory)) {
            collection = undefined;
          }
        }
        if (collection === undefined) {
          collection = new groupSpec.Collection();
          collection.add(new groupSpec.Model());
        }
        collection.collectionManager = this;
        Storage.bindGroupSpecs(collection);

        this._allGroupSpecsCollectionPromise = deferred.promise();
        deferred.resolve(collection);
      }
      return this._allGroupSpecsCollectionPromise;
    }
  });
    
  var _instance;

  return function() {
    if ( !_instance ) {
      _instance = new CollectionManager();
    }
    return _instance;
  };

});