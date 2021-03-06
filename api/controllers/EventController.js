/**
 * EventController
 *
 * @description :: Server-side logic for managing events
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
//var async = require('async');
var ObjectId = require('mongodb').ObjectId;

module.exports = {

  subscribeUser: function (req, res) {
    var email = req.param('email');
    token = Math.random().toString(36).substr(2, 8);
    console.log('#EventController.subscribeUser with param email :' + email);
    User.findOne({"facebook.email": email}, function userFound(err, userFound) {
      if (err)
        throw err;
      console.log('User found ' + userFound);
      if (!userFound)
        res.send('No user found with such email');
      else {
        User.update({"facebook.email": email}, {token: token}, function userUpdated(err, userUpdated) {
          if (err)
            throw err;
          console.log('user after subscription ' + userUpdated);
          EmailService.sendEmail(email, token);
          res.send('finished sending mail');
        });
      }
    });
  },

  confirmSubscription: function (req, res) {
    console.log('#EventController.confirmInvitation');
    var token = req.param('token');
    console.log('with param token : ' + token);
    User.findOne({token: token}, function (err, user) {
      if (err)
        throw err;
      console.log('User found ' + user);
      if (user) {
        User.update({token: token}, {token: '+'}, function userUpdated(err, user) {
          console.log('the token of the user is ' + user.token);
          console.log('user : ' + user);
          if (err)
            throw err;

          res.send('You have successfully confirmed coming to the event ! See you there !');
        });
      } else
        res.send('This token doesn\'nt exist or was already used !');
    });
  },

  //CRUD
  create: function (req, res) { // needs to be authentificated
    console.log('#EventController.create');
    var event = {};
    event.title = req.param('title');
    event.description = req.param('description');
    event.address = req.param('address');
    var lat = req.param('lat');
    var lng = req.param('lng');
    var location = {latitude: lat, longitude: lng};
    event.location = location;
    event.type = req.param('type');
    //   event.owner = req.user; // TODO : to check later
    Event
      .addNew(event)
      .then(function (createdEvent) {
        console.log('Created event ' + createdEvent);
        return res.send({event: createdEvent});
      })
      .catch(function (err) {
        console.log('Error when adding new event ' + err);
        return res.badRequest();
      });
  },

  update: function (req, res) {
    var event = {};
    for (var prop in req.body) {
      //console.log('Key : ' + prop);
      //console.log('Value : ' + req.body[prop]);
      event[prop] = req.body[prop];
    }
    //console.log('New event to update ');
//    console.log(event);
    var id = req.param('id');
    console.log('#EventController with id ' + id);
    Event
      .update({id: id}, event)
      .then(function (updatedEvent) {
        console.log('Has updated event ');
        console.log(updatedEvent);
        return res.send({event: updatedEvent});
      })
      .catch(function (err) {
        console.log('Error when updating event ' + err);
        return res.badRequest();
      });
  },

  delete: function (req, res) {
    var id = req.param('id');
    Event
      .destroy({id: id})
      .then(function (deletedEvent) {
        console.log('Deleted event : ' + deletedEvent);
        return res.send('Event deleted');
      })
      .catch(function (err) {
        console.log('Error when destroying event ' + err);
        return res.badRequest();
      })
  },

  find: function (req, res) {
    console.log('#EventController.find');
    Event
      .find()
      .then(function (events) {
        console.log('Success finding events ' + events);
        return res.send({events: events});
      })
      .catch(function (err) {
        console.log('Error when trying to find events ' + err);
        return res.badRequest();
      });
  },

  findOne: function (req, res) {
    console.log('#EventController.findById');
    var id = req.param('id');
    console.log('id is : ' + id);
    Event
      .findOne({id: id})
      .then(function (event) {
        console.log('+ event found ' + event);
        return res.send({event: event});
      })
      .catch(function (err) {
        console.log('- error with findById ' + err);
        return res.badRequest();
      })
  },

  registerUsersToEvent: function (req, res) {
    var eventId = req.param('eventId');
    var usersIds = req.param('usersIds');
    var _id = new ObjectID(eventId);
    console.log('#EventController.find ');
    console.log('eventId : ' + eventId + ' usersIds ' + usersIds);
    var event, users = [];
    Event
      .find({_id: _id})
      .then(function (foundEvents) {
        event = foundEvents[0];
        console.log('Event found : ' + foundEvents);
        for (var i = 0; i < usersIds.length; ++i) {
          var userId = new ObjectID(usersIds[i]);
          User
            .find({_id: userId})
            .then(function (user) {
              user = user[0];
              console.log('will associate user ' + user);
              console.log(' with event ' + event);
              if (user.invitedToEvents == undefined)
                user.invitedToEvents = [];
              if (event.invitedPeople == undefined)
                event.invitedPeople = [];
              user.invitedToEvents.push(event);
              users.push(user);
              event.invitedPeople.push(user);
            })
            .catch(function (err) {
              console.log('Error when trying to find user. ' + err);
            });
        }
      })
      .catch(function (err) {
        console.log('Problem finding event ' + err);
        return res.badRequest();
      });
    Event
      .update({_id: _id}, event)
      .then(function (updatedEvent) {
        console.log('Updateevent : ' + updatedEvent);
      })
      .catch(function (err) {
        console.log('Error when updating event ' + err);
      });
    console.log('Will launch the for loop');
    //async.each(users,
    //  function (user) {
    //    User
    //      .update({_id: curUser._id}, curUser)
    //      .then(function (updatedUser) {
    //        console.log('User after update ' + updatedUser);
    //      })
    //      .catch(function (err) {
    //        console.log('Error when updating user ' + err);
    //      });
    //  },
    //  function () {
    //    return res.send('Finished iteration');
    //  });
  }

};

