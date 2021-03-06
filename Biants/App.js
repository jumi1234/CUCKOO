import React, { Component } from 'react';
import { StyleSheet, Text, View, Image, AsyncStorage, TouchableOpacity } from 'react-native';
import { createStackNavigator, createAppContainer, StackActions, NavigationActions } from 'react-navigation';
import MainScreen from './MainScreen';
import HomeTab from './AppTabNavigator/HomeTab';
import Board from './AppTabNavigator/Board';
import MessageTab from './AppTabNavigator/MessageTab';
import ChatTab from './AppTabNavigator/ChatTab';
import ProfileTab from './AppTabNavigator/ProfileTab';
import Login from './AppTabNavigator/Login';
import Register from './AppTabNavigator/Register';
import SplashScreen from 'react-native-splash-screen';
import firebase from './src/config';
import StackNavigator from './StackNavigator';
import Stack from './Stack';
import PushNotification from 'react-native-push-notification';
import fb from 'react-native-firebase';



export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      loading: true,
      user: '',
    };
  }
  /**
   * When the App component mounts, we listen for any authentication
   * state changes in Firebase.
   * Once subscribed, the 'user' parameter will either be null
   * (logged out) or an Object (logged in)
   */

  notification() {
      PushNotification.localNotification({
        message: '새로운 메시지가 도착했습니다',
        largeIcon: 'ic_launcher_cuckoo',
        // playSound: true(default) occur crash when user click notification while app is running in background
        // playSound: false,
      });
  }


  componentDidMount() {
    setTimeout(() => {
     SplashScreen.hide();
    }, 1000);
    this.authSubscription = firebase.auth().onAuthStateChanged((user) => {
      this.setState({
        loading: false,
        user,
      });
    });

    this._updateTokenToServer();
    this._listenForNotifications();

  }

  // pushCondition() {
  //     if(firebase.auth().currentUser) {
  //     firebase.firestore().collection('notification').where('id', '==', firebase.auth().currentUser.email)
  //       .get()
  //       .then(querySnapshot => {
  //         const pushPermision = querySnapshot.docs.map(doc => doc.data());
  //         if(pushPermision[0].push) {
  //           this.setState({push: pushPermision[0].push});
  //         }
  //     });
  //
  //     firebase.firestore().collection('lastAccess').where('id', '==', firebase.auth().currentUser.email)
  //       .get()
  //       .then(querySnapshot => {
  //         const access = querySnapshot.docs.map(doc => doc.data());
  //         if(access[0].accessTime) {
  //           this.setState({accessTime: access[0].accessTime});
  //         }
  //     });
  //
  //     const push = this.state.push;
  //     const time = this.state.accessTime;
  //
  //     if(push && time) {
  //       firebase.firestore().collection('newmessage').where('receiver', '==', firebase.auth().currentUser.email)
  //         .get()
  //         .then(querySnapshot => {
  //   //         const newMsg = querySnapshot.data();
  //          const newMsg = querySnapshot.docs.map(doc => doc.data());
  //
  //           if(newMsg.length > 0) {
  //
  //             PushNotification.localNotification({
  //               message: '메시지가 도착했습니다',
  //               largeIcon:  'ic_push',
  //             });
  //
  //             // querySnapshot.forEach(function(doc) {
  //             //   doc.ref.delete();
  //             // });
  //           }
  //       });
  //     }
  //   }
  // }
  /**
   * Don't forget to stop listening for authentication state changes
   * when the component unmounts.
   */

   async pushCondition() {
     if(firebase.auth().currentUser) {
        firebase.firestore().collection('notification').where('id', '==', firebase.auth().currentUser.email)
          .get()
          .then(querySnapshot => {
            const pushPermision = querySnapshot.docs.map(doc => doc.data());
            if(pushPermision[0].push) {
              this.setState({push: pushPermision[0].push});
            }
        });
     }
   }

   deleteNewmsg() {
     if(firebase.auth().currentUser) {
       var newMsg = firebase.firestore().collection("newmessages").where('receiver', '==', firebase.auth().currentUser.email);

       newMsg
       .get()
       .then(function(querySnapshot) {
         querySnapshot.forEach(function(doc) {
           if(doc) {
             doc.ref.delete();
           }
         });
       });
     }
   }

    async _requestPermission(){
      try {
        // User has authorised
        await fb.messaging().requestPermission();
        await this._updateTokenToServer();
      } catch (error) {
          // User has rejected permissions
          alert("you can't handle push notification");
      }
    }

    async _updateTokenToServer(){
      const fcmToken = await fb.messaging().getToken();
      this.setState({fcmToken: fcmToken});
    }

    async _listenForNotifications() {

      // Foreground
      this.notificationListener = fb.notifications().onNotification((notification) => {
          // this.pushCondition();
          // if(this.state.push == true) {
            console.log('onNotification', notification);
             this.notification();
          //   this.deleteNewmsg();
          // } else {
          //   this.deleteNewmsg();
          // }
      });

      this.messageListener = fb.messaging().onMessage((notification ) => {
      // Process your message as required
      // This listener is called with the app activated
        console.log('활성화 중 앱 오픈' + notification);
      });

      // Background
      this.notificationOpenedListener = fb.notifications().onNotificationOpened((notificationOpen) => {
        console.log('어플 오픈');
      });

      // Closed
      const notificationOpen = await fb.notifications().getInitialNotification();
        if (notificationOpen) {
           console.log('어플 오픈(close)');
        }
      }

  componentWillUnmount() {
    this.authSubscription();
    this.notificationListener();
    this.notificationOpenedListener();
    this.messageListener();
  }

  render() {

    if(firebase.auth().currentUser) {
      if(this.state.fcmToken) {
        firebase.firestore().collection('tokens').doc(firebase.auth().currentUser.email).set({
          id: firebase.auth().currentUser.email,
          token: this.state.fcmToken,
        });
      }
    }
    // The application is initialising
    if (this.state.loading) return null;
    // The user is an Object, so they're logged in
    if (this.state.user) return <StackNavigator user={this.state.user}/>;
    // The user is null, so they're logged out
    return <Stack user={this.state.user}/>;
  }
}
