import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript } from 'lightning/platformResourceLoader';
import { createRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import MESSAGE_OBJECT from '@salesforce/schema/Chat_Message__c';
import CONTENT_FIELD from '@salesforce/schema/Chat_Message__c.Content__c';
import SOCKET_IO_JS from '@salesforce/resourceUrl/socketiojs';
import Id from '@salesforce/user/Id';
import getTodayMessages from '@salesforce/apex/ChatController.getTodayMessages';

export default class WebsocketChat extends LightningElement {
  @api userId = Id;
  @api timeString;
  @api message;
  @api error;

  _socketIoInitialized = false;
  _content;

  @wire(getTodayMessages)
  messages

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

  logMessages(){
    console.log('messages', this.messages);
  }

  initSocketIo(){
    // eslint-disable-next-line no-undef
    const socket = io.connect('https://sf-chat-websocket-server.herokuapp.com/');

    const textarea = this.template.querySelector('.message-input');

    if (socket !== undefined) {

      socket.on('time', (timeString) => {
        this.timeString = timeString;
      });

      socket.on('output', (data) => {
        if (data) {
          const fields = {};
          fields[CONTENT_FIELD.fieldApiName] = data.message;
          const messageInput = { apiName: MESSAGE_OBJECT.objectApiName, fields };
          createRecord(messageInput)
            .then(() => {
                socket.emit('transmit');
                return refreshApex(this.messages);
            })
            .catch(error => {
              this.error = error;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating message',
                        message: 'There was an error',
                        variant: 'error',
                    }),
                );
            });

        }
      });

      textarea.addEventListener('keydown', (event) => {
        if (!this.userId) {
          this.userId = new Date().toTimeString();
        }

        if (event.which === 13 && event.shiftKey == false) {
          event.preventDefault();
          socket.emit('input', {
            name: this.userId,
            message: textarea.value
          })
        }
      });

      socket.on('status', (data) => {
        if (data.success) {
          textarea.value = '';
          this.message = data.message;
          // eslint-disable-next-line @lwc/lwc/no-async-operation
          setTimeout(() => {
            this.message = '';
          }, 1000)
          this.error = '';
        } else if (!data.success) {
          this.error = data.message;
          // eslint-disable-next-line @lwc/lwc/no-async-operation
          setTimeout(() => {
            this.error = '';
          }, 1000)
          this.message = '';
        }
      })

      socket.on('chatupdated', () => {
        return refreshApex(this.messages);
      });

    }

  }
}