import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript } from 'lightning/platformResourceLoader';
import { getRecord, createRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import MESSAGE_OBJECT from '@salesforce/schema/Chat_Message__c';
import CONTENT_FIELD from '@salesforce/schema/Chat_Message__c.Content__c';
import SOCKET_IO_JS from '@salesforce/resourceUrl/socketiojs';
import USER_ID from '@salesforce/user/Id';
import CHAT_ACTIVE_FIELD from '@salesforce/schema/User.Chat_Active__c';
import getTodayMessages from '@salesforce/apex/ChatController.getTodayMessages';
import setUserChatActive from '@salesforce/apex/ChatController.setUserChatActive';
import setUserChatInactive from '@salesforce/apex/ChatController.setUserChatInactive';

export default class WebsocketChat extends LightningElement {
  @api userId = USER_ID;
  @api timeString;
  @api message;
  @api error;
  @api isChatActive = false;
  @api isTyping = false;
  @api chatUsers = [{id: 1234, name: 'Michael Scott'}, {id: 12345, name: 'Dwight Schrute'}]

  _socketIoInitialized = false;

  @wire(getRecord, {recordId: USER_ID, fields: [CHAT_ACTIVE_FIELD]})
  wiredUser({error, data}) {
    if (error) {
      this.error = error;
    } else if (data) {
      this.isChatActive = data.fields.Chat_Active__c.value;
    }
  }

  @wire(getTodayMessages)
  messages

  /**
   * Loading the socket.io script.
   */
  renderedCallback(){
    if (this._socketIoInitialized) {
      return;
    }
    this._socketIoInitialized = true;

    Promise.all([
      loadScript(this, SOCKET_IO_JS),
    ])
    .then(() => {
      this.initSocketIo();
    })
    .catch(error => {
      this.dispatchEvent(
        new ShowToastEvent({
         title: 'Error loading socket.io',
          message: error.message,
          variant: 'error',
        }),
      );
    });
  }

  /**
   * After socket.io has initialized, make our socket connection and register listeners. 
   */
  initSocketIo(){
    // eslint-disable-next-line no-undef
    const socket = io.connect('https://sf-chat-websocket-server.herokuapp.com/');
    const messageInput = this.template.querySelector('.message-input');

    if (socket !== undefined) {

      /**
       * Not necessary for functionality. It just demonstrates the socket connecting with the server.
       */
      socket.on('time', (timeString) => {
        this.timeString = timeString;
      });

      /**
       * After the user hits enter, the input field text is sent to the wss server and back to us in the
       * 'output' event.
       */
      messageInput.addEventListener('keydown', (event) => {
        socket.emit('usertyping', { userId: this.userId });
        // Tab key for when input field is put into focus.
        if (event.keyCode !== 9) {
          socket.emit('usertyping', { userId: this.userId });
        }
        if (event.which === 13 && event.shiftKey === false) {
          event.preventDefault();
          socket.emit('input', {
            name: this.userId,
            message: messageInput.value
          })
        }
      });

      /**
       * When the user has released typing, debounce relased and after 1 second mark the user as
       * not typing at longer. 
       * Used for displaying the typing indicator to the other connected users.
       */
      messageInput.addEventListener('keyup', this.debounce( (event) => {
        socket.emit('usernottyping', { userId: this.userId });
      }, 1000));

      /**
       * If we received an event indicating that a user is typing, display the typing indicator
       * if it's not the current user.
       * TODO: Handle more than just 2 users.
       */
      socket.on('istyping', (data) => {
        if (data.userId !== this.userId) {
          this.isTyping = true;
        }
      });

      /**
       * If we received an event indicating that a user has stopped typing, stop displaying the typing indicator
       * if it's not the current user.
       * TODO: Handle more than just 2 users.
       */
      socket.on('nottyping', (data) => {
        if (data.userId !== this.userId) {
          this.isTyping = false;
        }
      });

      /**
       * After the input text has been submitted, this event routes back to us so that we can create 
       * a new Chat_Message__c record. 
       */
      socket.on('output', (data) => {
        if (data) {
          const fields = {};
          fields[CONTENT_FIELD.fieldApiName] = data.message;
          const message = { apiName: MESSAGE_OBJECT.objectApiName, fields };

          createRecord(message)
            .then(() => {
                socket.emit('transmit');
                return refreshApex(this.messages);
            })
            .catch(error => {
              this.error = error;
              console.log('error', error);
              this.dispatchEvent(
                  new ShowToastEvent({
                      title: 'Error creating message',
                      message: 'There was an error creating your message',
                      variant: 'error',
                  }),
              );
            });
        }
      });

      /**
       * Setting various messages received back from the socket connection.
       */
      socket.on('status', (data) => {
        if (data.success) {
          messageInput.value = '';
          this.message = data.message;
          this.messageResetDelay('message');
          this.error = '';
        } else if (!data.success) {
          this.error = data.message;
          this.messageResetDelay('error');
          this.message = '';
        }
      })

      /**
       * If we're told that a message was sent to the chatroom, refresh the stale messages data.
       */
      socket.on('chatupdated', () => {
        return refreshApex(this.messages);
      });

    }

  }

  get isMessages(){
    if (this.messages.data) {
      return this.messages.data.length > 0;
    }
    return false;
  }

  get isInputDisabled(){
    return this.isChatActive ? false : true;
  }

  get inputPlaceholderText(){
    return this.isInputDisabled ? 'Enter chat to being' : 'Type your message';
  }

  handleEnterChat() {
    setUserChatActive()
      .then((res) => {
        this.isChatActive = res.Chat_Active__c;
      })
      .catch(error => {
        console.error('error', error)
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error updating user record',
                message: 'There was an error entering the chat',
                variant: 'error',
            }),
        );
      });
  }

  handleLeaveChat(){
    setUserChatInactive()
      .then((res) => {
        this.isChatActive = res.Chat_Active__c;
      })
      .catch(error => {
        console.error('error', error)
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error updating user record',
                message: 'There was an error leaving the chat',
                variant: 'error',
            }),
        );
      });
  }

  debounce(callback, wait){
    let timeout;
    return (...args) => {
        const context = this;
        clearTimeout(timeout);
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        timeout = setTimeout(() => callback.apply(context, args), wait);
    };
  }

  /**
   * Utility function to remove any displayed message after 1 second.
   * @param {Text} msgType - Maps to the component message attribute.
   */
  messageResetDelay(msgType){
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => {
      this[msgType] = '';
    }, 1000)
  }

  /**
   * Utility function to console.log the messages data.
   */
  logMessages(){
    // eslint-disable-next-line no-console
    console.log('messages', this.messages);
  }

}