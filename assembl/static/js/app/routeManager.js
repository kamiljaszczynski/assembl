'use strict';

var Marionette = require('backbone.marionette'),
    App = require('./app.js'),
    Ctx = require('./common/context.js'),
    Agents = require('./models/agents.js'),
    Storage = require('./objects/storage.js'),
    Navbar = require('./views/navBar.js'),
    GroupContainer = require('./views/groups/groupContainer.js'),
    CollectionManager = require('./common/collectionManager.js'),
    ViewsFactory = require('./objects/viewsFactory.js'),
    AdminDiscussion = require('./views/admin/adminDiscussion.js'),
    AdminNotificationSubscriptions = require('./views/admin/adminNotificationSubscriptions.js'),
    AdminPartners = require('./views/admin/adminPartners.js'),
    UserNotificationSubscriptions = require('./views/user/userNotificationSubscriptions.js'),
    Profile = require('./views/user/profile.js'),
    Authorization = require('./views/authorization.js'),
    Permissions = require('./utils/permissions.js'),
    Account = require('./views/user/account.js'),
    AdminDiscussionSettings = require('./views/admin/adminDiscussionSettings.js'),
    i18n = require('./utils/i18n.js');

var routeManager = Marionette.Object.extend({

    initialize: function () {
        window.assembl = {};

        this.collectionManager = new CollectionManager();

        /**
         * fulfill app.currentUser
         */
        this.loadCurrentUser();
    },

    defaults: function () {
        Backbone.history.navigate('', true);
    },

    home: function () {
        Ctx.isNewUser();
        this.restoreViews();
    },

    edition: function () {
        App.headerRegions.show(new NavBar());
        if (this.userHaveAccess()) {
            var edition = new AdminDiscussion();
            Assembl.groupContainer.show(edition);
        }
    },

    partners: function () {
        App.headerRegions.show(new navBar());
        if (this.userHaveAccess()) {
            var partners = new AdminPartners();
            App.groupContainer.show(partners);
        }
    },

    notifications: function () {
        App.headerRegions.show(new navBar());
        if (this.userHaveAccess()) {
            var notifications = new AdminNotificationSubscriptions();
            App.groupContainer.show(notifications);
        }
    },

    settings: function(){
        App.headerRegions.show(new navBar());
        if (this.userHaveAccess()) {
            var adminSetting = new AdminDiscussionSettings();
            App.groupContainer.show(adminSetting);
        }
    },

    userNotifications: function () {
        App.headerRegions.show(new navBar());
        if (this.userHaveAccess()) {
            var user = new UserNotificationSubscriptions();
            App.groupContainer.show(user);
        }
    },

    profile: function () {
        App.headerRegions.show(new navBar());
        if (this.userHaveAccess()) {
            var profile = new userProfile();
            App.groupContainer.show(profile);
        }
    },

    account: function(){
        App.headerRegions.show(new navBar());
        if (this.userHaveAccess()) {
            var account = new userAccount();
            App.groupContainer.show(account);
        }
    },

    post: function (id) {
        //TODO: add new behavior to show messageList Panel
        this.restoreViews();

        // test if this issue fixed
        App.vent.trigger("navigation:selected", 'debate', { show_help: false });
        App.vent.trigger('messageList:showMessageById', id);

        /*setTimeout(function () {
            //TODO: fix this horrible hack
            //We really need to address panels explicitely
            Assembl.vent.trigger("navigation:selected", 'debate');
            Assembl.vent.trigger('messageList:showMessageById', id);
        }, 0);*/
        //TODO: fix this horrible hack that prevents calling
        //showMessageById over and over.
        //window.history.pushState('object or string', 'Title', '../');
        console.log("DEFAULT ");
        Backbone.history.navigate('/', {replace: true});
    },

    idea: function (id) {
        //TODO: add new behavior to show messageList Panel
        this.restoreViews();

        setTimeout(function () {
            //TODO: fix this horrible hack
            //We really need to address panels explicitely
            App.vent.trigger("navigation:selected", 'debate');
            App.vent.trigger('ideaList:selectIdea', id, "from_url", true);
        }, 0);
        //TODO: fix this horrible hack that prevents calling
        //showMessageById over and over.
        //window.history.pushState('object or string', 'Title', '../');
        Backbone.history.navigate('/', {replace: true});
    },

    loadCurrentUser: function () {
        var user = null;
        if (Ctx.getCurrentUserId()) {
            user = new Agents.Model();
            user.fetchFromScriptTag('current-user-json');
        }
        else {
            user = new Agents.Collection().getUnknownUser();
        }
        user.fetchPermissionsFromScriptTag();
        Ctx.setCurrentUser(user);
        Ctx.loadCsrfToken(true);
    },

    restoreViews: function () {
        App.headerRegions.show(new NavBar());
        /**
         * Render the current group of views
         * */
        var groupSpecsP = this.collectionManager.getGroupSpecsCollectionPromise(ViewsFactory);

        groupSpecsP.done(function (groupSpecs) {
            var group = new GroupContainer({
                collection: groupSpecs
            });
            var lastSave = storage.getDateOfLastViewSave();
            if (!lastSave
                || (Date.now() - lastSave.getTime() > (7 * 24 * 60 * 60 * 1000))
                ) {
                /* Reset the context of the user view, if it's too old to be
                 usable, or if it wasn't initialized before */
                // Find if a group exists that has a navigation panel
                var navigableGroupSpec = groupSpecs.find(function (aGroupSpec) {
                    return aGroupSpec.findNavigationSidebarPanelSpec();
                });
                if (navigableGroupSpec) {
                    setTimeout(function () {
                        var groupContent = group.children.findByModel(navigableGroupSpec);
                        groupContent.resetContextState();
                    });
                }
            }
            //console.log(group);
            group.resizeAllPanels();
            App.groupContainer.show(group);
        });
    },

    userHaveAccess: function () {
        /**
         * TODO: backend api know private discussion and can redirect to login
         * add this method to home page route
         * */
        var route = Backbone.history.fragment,
            access = false;

        if (!Ctx.getCurrentUserId()) {
            var authorization = new Authorization({
                error: 401,
                message: i18n.gettext('You must be logged in to access this page.')
            });
            App.groupContainer.show(authorization);
            return;
        }

        switch(route){
            case 'edition':
            case 'settings':
            case 'notifications':
            case 'partners':
                access = (!Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION)) ? false : true;
                break;

            default:
                access = (!Ctx.getCurrentUser().can(Permissions.READ)) ? false : true;
                break;
        }

        if(!access){
            var authorization = new Authorization({
                error: 401,
                message: i18n.gettext('Your level of permissions do not allow you to see the rest of this content')
            });
            App.groupContainer.show(authorization);
        }

        return access;
    }

});

module.exports = routeManager;